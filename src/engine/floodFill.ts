import { GridCell } from '../types';
import { calculateInlandSurge, SurgeModelAssumptions } from './surge';

export interface FloodSimulationResult {
  grid: GridCell[][];
  maxFloodDepthM: number;
  totalInundatedAreaKm2: number;
  totalExposedPopulation: number;
  highRiskCellCount: number; // depth > 1.5m
}

/**
 * Hydrologically-connected Flood Fill and Flow Accumulation Simulation
 */
export function simulateFloodField(
  rawGrid: GridCell[][],
  peakSurgeCoastM: number,
  precipitationForecastMm: number = 180,
  assumptions?: Partial<SurgeModelAssumptions>
): FloodSimulationResult {
  const height = rawGrid.length;
  if (height === 0) {
    return {
      grid: [],
      maxFloodDepthM: 0,
      totalInundatedAreaKm2: 0,
      totalExposedPopulation: 0,
      highRiskCellCount: 0,
    };
  }
  const width = rawGrid[0].length;

  // Deep clone grid to avoid mutation
  const grid: GridCell[][] = rawGrid.map((row) =>
    row.map((cell) => ({
      ...cell,
      surgeHeightM: 0,
      floodDepthM: 0,
      isFlooded: false,
      rainfallAccumulationMm: 0,
    }))
  );

  // Step 1: Compute local potential surge height for each cell
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (cell.isSea) {
        cell.surgeHeightM = peakSurgeCoastM;
        cell.floodDepthM = 0;
      } else {
        cell.surgeHeightM = calculateInlandSurge(
          peakSurgeCoastM,
          cell.distCoastKm,
          cell.roughness,
          assumptions
        );
      }
    }
  }

  // Step 2: Hydrological Ocean Flood-Fill Connectivity (Breadth-First Search from sea cells)
  // Only cells connected by contiguous lower elevation than surge will flood
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const queue: [number, number][] = [];

  // Seed BFS queue with all ocean boundary cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].isSea) {
        queue.push([x, y]);
        visited[y][x] = true;
      }
    }
  }

  // 8-directional neighbor offsets
  const dx = [-1, 0, 1, -1, 1, -1, 0, 1];
  const dy = [-1, -1, -1, 0, 0, 1, 1, 1];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;

    for (let i = 0; i < 8; i++) {
      const nx = cx + dx[i];
      const ny = cy + dy[i];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited[ny][nx]) {
          const neighbor = grid[ny][nx];
          if (!neighbor.isSea) {
            // Cell floods if its elevation is lower than the local arriving surge height
            if (neighbor.elevationM < neighbor.surgeHeightM) {
              neighbor.isFlooded = true;
              neighbor.floodDepthM = Number(
                Math.max(0, neighbor.surgeHeightM - neighbor.elevationM).toFixed(2)
              );
              visited[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  // Step 3: Rainfall pooling / D8 Flow Accumulation
  // For each land cell, direct rainfall drainage towards steepest descent neighbor
  const flowAccum = Array.from({ length: height }, () => Array(width).fill(precipitationForecastMm));

  // Sort land cells from highest elevation to lowest
  const landCells: { x: number; y: number; elevation: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x].isSea) {
        landCells.push({ x, y, elevation: grid[y][x].elevationM });
      }
    }
  }
  landCells.sort((a, b) => b.elevation - a.elevation); // descending

  for (const c of landCells) {
    let steepestDrop = 0;
    let targetX = -1;
    let targetY = -1;

    for (let i = 0; i < 8; i++) {
      const nx = c.x + dx[i];
      const ny = c.y + dy[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighbor = grid[ny][nx];
        const dist = i % 2 === 0 ? 1.414 : 1.0;
        const drop = (c.elevation - neighbor.elevationM) / dist;
        if (drop > steepestDrop) {
          steepestDrop = drop;
          targetX = nx;
          targetY = ny;
        }
      }
    }

    if (targetX !== -1 && targetY !== -1) {
      // Flow accumulates down to neighbor
      flowAccum[targetY][targetX] += flowAccum[c.y][c.x] * 0.7; // 30% infiltration / retention
    }
  }

  // Assign rainfall accumulation & augment flood depth in low-lying drainage depressions
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      cell.rainfallAccumulationMm = Math.round(flowAccum[y][x]);
      if (!cell.isSea && cell.rainfallAccumulationMm > 350 && cell.elevationM < 4.0) {
        // High pooling adds up to 0.4m additional local pluvial ponding
        const pluvialDepth = (cell.rainfallAccumulationMm - 350) / 1000;
        cell.floodDepthM = Number((cell.floodDepthM + pluvialDepth).toFixed(2));
        if (cell.floodDepthM > 0.1) {
          cell.isFlooded = true;
        }
      }
    }
  }

  // Step 4: Summary KPIs
  // Each cell represents roughly ~2km x 2km = 4 km² in our screening grid
  const CELL_AREA_KM2 = 4.0;
  let maxFloodDepthM = 0;
  let totalInundatedAreaKm2 = 0;
  let totalExposedPopulation = 0;
  let highRiskCellCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (cell.isFlooded && !cell.isSea) {
        if (cell.floodDepthM > maxFloodDepthM) {
          maxFloodDepthM = cell.floodDepthM;
        }
        totalInundatedAreaKm2 += CELL_AREA_KM2;
        totalExposedPopulation += Math.round(cell.populationDensity * CELL_AREA_KM2);
        if (cell.floodDepthM >= 1.5) {
          highRiskCellCount++;
        }
      }
    }
  }

  return {
    grid,
    maxFloodDepthM: Number(maxFloodDepthM.toFixed(2)),
    totalInundatedAreaKm2: Math.round(totalInundatedAreaKm2),
    totalExposedPopulation,
    highRiskCellCount,
  };
}
