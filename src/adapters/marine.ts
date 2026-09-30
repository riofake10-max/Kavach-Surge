export interface MarineConditions {
  waveHeightM: number;
  wavePeriodS: number;
  waveDirectionDeg: number;
  source: 'live' | 'cached' | 'fallback';
}

const marineCache = new Map<string, { data: MarineConditions; expires: number }>();

export async function fetchLiveMarine(lat: number, lng: number): Promise<MarineConditions> {
  const cacheKey = `marine_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const now = Date.now();

  const cached = marineCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return { ...cached.data, source: 'cached' };
  }

  try {
    const sessionVal = sessionStorage.getItem(cacheKey);
    if (sessionVal) {
      const parsed = JSON.parse(sessionVal);
      if (parsed.expires > now) {
        marineCache.set(cacheKey, parsed);
        return { ...parsed.data, source: 'cached' };
      }
    }
  } catch {
    // ignore
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_period,wave_direction&timezone=auto`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Marine HTTP ${res.status}`);
    const json = await res.json();
    const cur = json.current || {};

    const data: MarineConditions = {
      waveHeightM: cur.wave_height ?? 3.4,
      wavePeriodS: cur.wave_period ?? 8.2,
      waveDirectionDeg: cur.wave_direction ?? 190,
      source: 'live',
    };

    const cacheEntry = { data, expires: now + 30 * 60 * 1000 };
    marineCache.set(cacheKey, cacheEntry);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch {
      // ignore
    }

    return data;
  } catch {
    clearTimeout(timeoutId);
    return {
      waveHeightM: 4.8, // severe cyclone offshore sea state
      wavePeriodS: 11.5,
      waveDirectionDeg: 205,
      source: 'fallback',
    };
  }
}
