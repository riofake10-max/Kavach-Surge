import { GridCell } from '../types';
import { generateFallbackGrid } from '../data/fallbackData';

const elevationCache = new Map<string, { grid: GridCell[][]; expires: number }>();

export async function fetchElevationGrid(
  landfallLat: number,
  landfallLng: number,
  isAmphan: boolean = false
): Promise<{ grid: GridCell[][]; source: 'live' | 'cached' | 'fallback' }> {
  const cacheKey = `elev_grid_${landfallLat.toFixed(2)}_${landfallLng.toFixed(2)}`;
  const now = Date.now();

  const cached = elevationCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return { grid: cached.grid, source: 'cached' };
  }

  try {
    const sessionVal = sessionStorage.getItem(cacheKey);
    if (sessionVal) {
      const parsed = JSON.parse(sessionVal);
      if (parsed.expires > now) {
        elevationCache.set(cacheKey, parsed);
        return { grid: parsed.grid, source: 'cached' };
      }
    }
  } catch {
    // ignore
  }

  // Pre-generate grid coordinates
  const fallback = generateFallbackGrid(landfallLat, landfallLng, isAmphan);
  const size = fallback.length;

  // Flatten coordinates for batched elevation request
  const allCoords: { x: number; y: number; lat: number; lng: number }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      allCoords.push({ x, y, lat: fallback[y][x].lat, lng: fallback[y][x].lng });
    }
  }

  try {
    // Open-Meteo allows max 100 coordinates per request. 400 coordinates = 4 batches
    const BATCH_SIZE = 100;
    const elevations: number[] = [];

    for (let i = 0; i < allCoords.length; i += BATCH_SIZE) {
      const chunk = allCoords.slice(i, i + BATCH_SIZE);
      const lats = chunk.map((c) => c.lat.toFixed(4)).join(',');
      const lngs = chunk.map((c) => c.lng.toFixed(4)).join(',');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Elevation API returned ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json.elevation)) {
        elevations.push(...json.elevation);
      } else {
        throw new Error('Invalid elevation payload');
      }
    }

    if (elevations.length === allCoords.length) {
      // Successfully fetched live elevations! Overlay on grid
      const liveGrid: GridCell[][] = fallback.map((row) => row.map((cell) => ({ ...cell })));
      for (let i = 0; i < allCoords.length; i++) {
        const { x, y } = allCoords[i];
        const elev = Math.max(0, Number(elevations[i].toFixed(1)));
        liveGrid[y][x].elevationM = elev;
        // Re-evaluate sea mask: points < 0.2m near water edge
        if (elev <= 0.1 && liveGrid[y][x].distCoastKm < 1.0) {
          liveGrid[y][x].isSea = true;
        }
      }

      const cacheEntry = { grid: liveGrid, expires: now + 2 * 60 * 60 * 1000 };
      elevationCache.set(cacheKey, cacheEntry);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch {
        // ignore
      }

      return { grid: liveGrid, source: 'live' };
    }
  } catch {
    // Fall back to synthetic topography grid
  }

  return { grid: fallback, source: 'fallback' };
}
