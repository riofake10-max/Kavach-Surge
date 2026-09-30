import { CriticalAsset, AssetStatus, GridCell, CascadeNodeImpact } from '../types';
import { calculateWindAtRadius, HollandParams, haversineDistanceKm } from './holland';

export interface CascadeSimulationResult {
  assets: CriticalAsset[];
  cascadeSummary: {
    failedSubstations: number;
    impairedHospitals: number;
    impairedShelters: number;
    cutRoads: number;
    flaggedBridges: number;
    totalPopulationAffected: number;
    headline: string;
  };
  nodeImpacts: CascadeNodeImpact[];
  dependencyLines: Array<{
    from: [number, number];
    to: [number, number];
    fromId: string;
    toId: string;
    isFailed: boolean;
  }>;
}

/**
 * Find local flood depth at any asset coordinate from the simulation grid
 */
export function interpolateFloodDepth(lat: number, lng: number, grid: GridCell[][]): number {
  if (grid.length === 0 || grid[0].length === 0) return 0;

  let nearestDist = Infinity;
  let nearestDepth = 0;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      const dist = haversineDistanceKm(lat, lng, cell.lat, cell.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestDepth = cell.floodDepthM;
      }
    }
  }

  return Number(nearestDepth.toFixed(2));
}

/**
 * Compute cascading failure states and dependency links across all infrastructure assets
 */
export function simulateInfrastructureCascades(
  rawAssets: CriticalAsset[],
  grid: GridCell[][],
  stormCentre: { lat: number; lng: number },
  hollandParams: HollandParams
): CascadeSimulationResult {
  // Deep clone assets
  const assets: CriticalAsset[] = rawAssets.map((a) => ({ ...a }));

  // 1. Calculate local hazard exposure for each asset
  for (const asset of assets) {
    const distToStormCenter = haversineDistanceKm(asset.lat, asset.lng, stormCentre.lat, stormCentre.lng);
    asset.windExposureKt = calculateWindAtRadius(distToStormCenter, hollandParams);
    asset.floodDepthM = interpolateFloodDepth(asset.lat, asset.lng, grid);
  }

  // 2. Determine Primary Failure state for Root Nodes (Power Substations and Roads/Bridges)
  const failedSubstationIds = new Set<string>();

  for (const asset of assets) {
    if (asset.type === 'substation') {
      // Substation fails if flood depth > 0.5m or extreme winds > 105kt tear transformers
      if (asset.floodDepthM >= 0.5 || asset.windExposureKt >= 105) {
        asset.status = 'failed';
        failedSubstationIds.add(asset.id);
      } else if (asset.floodDepthM >= 0.2 || asset.windExposureKt >= 75) {
        asset.status = 'impacted';
      } else if (asset.floodDepthM > 0 || asset.windExposureKt >= 50) {
        asset.status = 'at_risk';
      } else {
        asset.status = 'safe';
      }
    } else if (asset.type === 'road') {
      // Road becomes impassable at >0.3m flood depth
      asset.isRoadPassable = asset.floodDepthM < 0.3;
      if (asset.floodDepthM >= 0.3) {
        asset.status = 'failed';
      } else if (asset.floodDepthM > 0.1) {
        asset.status = 'impacted';
      } else {
        asset.status = 'safe';
      }
    } else if (asset.type === 'bridge') {
      // Bridges flagged at high wind > 64kt AND surge > 1.0m
      if (asset.windExposureKt >= 64 && asset.floodDepthM >= 1.0) {
        asset.status = 'failed';
      } else if (asset.windExposureKt >= 50 || asset.floodDepthM >= 0.5) {
        asset.status = 'impacted';
      } else {
        asset.status = 'safe';
      }
    }
  }

  // 3. Determine Secondary / Cascading Failures for Dependent Nodes (Hospitals, Shelters, Water Pumps)
  const nodeImpacts: CascadeNodeImpact[] = [];
  const dependencyLines: Array<{
    from: [number, number];
    to: [number, number];
    fromId: string;
    toId: string;
    isFailed: boolean;
  }> = [];

  // Index substations for quick lookup
  const substationMap = new Map<string, CriticalAsset>();
  assets.filter((a) => a.type === 'substation').forEach((sub) => substationMap.set(sub.id, sub));

  // Initialize impact tracking for each substation
  for (const [subId, sub] of substationMap.entries()) {
    nodeImpacts.push({
      substationId: subId,
      substationName: sub.name,
      dependentHospitals: [],
      dependentShelters: [],
      totalPopulationAffected: 0,
      isFailureCausedBySurge: sub.status === 'failed',
    });
  }

  for (const asset of assets) {
    if (asset.type === 'hospital' || asset.type === 'shelter' || asset.type === 'police' || asset.type === 'fire') {
      const upstreamSub = asset.upstreamSubstationId ? substationMap.get(asset.upstreamSubstationId) : undefined;
      const isPowerCut = upstreamSub ? failedSubstationIds.has(upstreamSub.id) : false;

      // Track dependency line for map visualization
      if (upstreamSub) {
        dependencyLines.push({
          from: [upstreamSub.lat, upstreamSub.lng],
          to: [asset.lat, asset.lng],
          fromId: upstreamSub.id,
          toId: asset.id,
          isFailed: isPowerCut,
        });

        // Record in nodeImpact
        const impact = nodeImpacts.find((n) => n.substationId === upstreamSub.id);
        if (impact) {
          if (asset.type === 'hospital') impact.dependentHospitals.push(asset.name);
          if (asset.type === 'shelter') impact.dependentShelters.push(asset.name);
          impact.totalPopulationAffected += asset.capacity ? asset.capacity * 4 : 5000;
        }
      }

      // Check direct hazard damage
      const isDirectFloodFailed = asset.floodDepthM >= 0.45;
      const isDirectWindDamaged = asset.windExposureKt >= 95;

      if (isDirectFloodFailed || isDirectWindDamaged) {
        asset.status = 'failed';
      } else if (isPowerCut && !asset.hasBackupPower) {
        // Cascade failure: Power lost AND no operational backup generator
        asset.status = 'failed';
      } else if (isPowerCut && asset.hasBackupPower) {
        // Backup generator active: mitigated to impacted
        asset.status = 'impacted';
      } else if (asset.floodDepthM >= 0.2 || asset.windExposureKt >= 65) {
        asset.status = 'impacted';
      } else if (asset.floodDepthM > 0 || asset.windExposureKt >= 45) {
        asset.status = 'at_risk';
      } else {
        asset.status = 'safe';
      }
    }
  }

  // 4. Calculate Vulnerability Index (0-100) per asset with full breakdown
  for (const asset of assets) {
    // Hazard Score (0-100): based on wind exposure & flood depth
    const floodScore = Math.min(100, (asset.floodDepthM / 2.5) * 100);
    const windScore = Math.min(100, (asset.windExposureKt / 120) * 100);
    const hazardScore = Math.round(floodScore * 0.65 + windScore * 0.35);

    // Dependency Score (0-100): does it rely on a failed power feed without backup?
    let dependencyScore = 0;
    if (asset.upstreamSubstationId && failedSubstationIds.has(asset.upstreamSubstationId)) {
      dependencyScore = asset.hasBackupPower ? 40 : 95;
    } else if (asset.type === 'substation' && asset.status === 'failed') {
      dependencyScore = 90; // High systemic impact
    }

    // Access Score (0-100): is road network flooded around this facility?
    const accessScore = asset.floodDepthM >= 0.3 ? 85 : asset.floodDepthM > 0.1 ? 40 : 10;

    // Weights: Hazard 40%, Dependency 35%, Access 25%
    const weights = { hazard: 0.4, dependency: 0.35, access: 0.25 };
    let rawIndex = Math.round(
      hazardScore * weights.hazard + dependencyScore * weights.dependency + accessScore * weights.access
    );

    // If AI evaluated this asset from drone/satellite imagery, blend AI assessment score (30% weight)
    if (asset.aiAssessedScore !== undefined) {
      rawIndex = Math.round(rawIndex * 0.7 + asset.aiAssessedScore * 0.3);
    }

    asset.vulnerabilityIndex = Math.min(100, Math.max(0, rawIndex));
    asset.vulnerabilityBreakdown = {
      hazardScore,
      dependencyScore,
      accessScore,
      weights,
    };
  }

  // Summary Metrics
  const failedSubstations = assets.filter((a) => a.type === 'substation' && a.status === 'failed').length;
  const impairedHospitals = assets.filter((a) => a.type === 'hospital' && (a.status === 'failed' || a.status === 'impacted')).length;
  const impairedShelters = assets.filter((a) => a.type === 'shelter' && (a.status === 'failed' || a.status === 'impacted')).length;
  const cutRoads = assets.filter((a) => a.type === 'road' && a.status === 'failed').length;
  const flaggedBridges = assets.filter((a) => a.type === 'bridge' && (a.status === 'failed' || a.status === 'impacted')).length;

  const totalPopulationAffected = nodeImpacts
    .filter((n) => failedSubstationIds.has(n.substationId))
    .reduce((sum, n) => sum + n.totalPopulationAffected, 0);

  const headline =
    failedSubstations > 0
      ? `${failedSubstations} substation failure${failedSubstations > 1 ? 's cut' : ' cuts'} power to ${impairedHospitals} hospital${impairedHospitals > 1 ? 's' : ''} and ${impairedShelters} shelter${impairedShelters > 1 ? 's' : ''} serving ~${totalPopulationAffected.toLocaleString('en-IN')} people.`
      : 'All grid distribution substations operating nominal. No secondary power failure cascades active.';

  return {
    assets,
    cascadeSummary: {
      failedSubstations,
      impairedHospitals,
      impairedShelters,
      cutRoads,
      flaggedBridges,
      totalPopulationAffected,
      headline,
    },
    nodeImpacts,
    dependencyLines,
  };
}
