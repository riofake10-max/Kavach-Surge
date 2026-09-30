export interface WeatherForecast {
  temperatureC: number;
  windSpeed10mKmh: number;
  windGusts10mKmh: number;
  precipitationMm: number;
  surfacePressureHpa: number;
  timestamp: string;
  source: 'live' | 'cached' | 'fallback';
}

const cache = new Map<string, { data: WeatherForecast; expires: number }>();

export async function fetchLiveWeather(lat: number, lng: number): Promise<WeatherForecast> {
  const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const now = Date.now();

  // Check in-memory / sessionStorage cache (15-min TTL)
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) {
    return { ...cached.data, source: 'cached' };
  }

  try {
    const sessionVal = sessionStorage.getItem(cacheKey);
    if (sessionVal) {
      const parsed = JSON.parse(sessionVal);
      if (parsed.expires > now) {
        cache.set(cacheKey, parsed);
        return { ...parsed.data, source: 'cached' };
      }
    }
  } catch {
    // ignore sessionStorage errors in restricted sandboxes
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,precipitation&timezone=auto`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    const cur = json.current || {};

    const data: WeatherForecast = {
      temperatureC: cur.temperature_2m ?? 29.5,
      windSpeed10mKmh: cur.wind_speed_10m ?? 45,
      windGusts10mKmh: cur.wind_gusts_10m ?? 65,
      precipitationMm: cur.precipitation ?? 14.5,
      surfacePressureHpa: cur.surface_pressure ?? 998,
      timestamp: cur.time || new Date().toISOString(),
      source: 'live',
    };

    // Cache for 15 minutes
    const cacheEntry = { data, expires: now + 15 * 60 * 1000 };
    cache.set(cacheKey, cacheEntry);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch {
      // ignore
    }

    return data;
  } catch {
    clearTimeout(timeoutId);
    // Return sensible coastal Bay of Bengal cyclonic meteorological fallback
    return {
      temperatureC: 28.2,
      windSpeed10mKmh: 68,
      windGusts10mKmh: 92,
      precipitationMm: 38.0,
      surfacePressureHpa: 986,
      timestamp: new Date().toISOString(),
      source: 'fallback',
    };
  }
}
