/**
 * Holland (1980) Parametric Wind Profile Model
 * 
 * Computes sustained radial wind velocity V(r) as a function of:
 * - r: distance from storm centre (km)
 * - Rmax: radius of maximum winds (km)
 * - Vmax: maximum sustained wind speed (kt)
 * - Pn: ambient surface pressure (hPa, standard 1010 hPa)
 * - Pc: central surface pressure (hPa)
 * - lat: latitude of storm centre (for Coriolis parameter f)
 */

export interface HollandParams {
  vmaxKt: number;
  pcHpa: number;
  pnHpa?: number;
  rmaxKm: number;
  latDeg: number;
}

export interface WindRadii {
  r34KtKm: number;
  r50KtKm: number;
  r64KtKm: number;
}

// Convert knots to m/s
const KT_TO_MS = 0.514444;
const MS_TO_KT = 1.94384;
const RHO_AIR = 1.15; // kg/m³ for tropical moist air

/**
 * Holland B parameter estimation (empirical fit based on Holland 2008 / Powell)
 */
export function calculateHollandB(vmaxKt: number, pcHpa: number, latDeg: number): number {
  const deltaP = Math.max(10, 1010 - pcHpa);
  // Empirical Holland B parameter typically between 1.0 and 2.5 in tropical cyclones
  const B = 1.88 - 0.0055 * Math.abs(latDeg) - 0.01 * (1010 - pcHpa) + 0.015 * vmaxKt;
  return Math.min(2.5, Math.max(1.1, Number(B.toFixed(2))));
}

/**
 * Compute wind speed (knots) at radius r (km) from cyclone centre using Holland (1980)
 */
export function calculateWindAtRadius(rKm: number, params: HollandParams): number {
  if (rKm <= 0.5) return 0; // eye calm

  const { vmaxKt, pcHpa, rmaxKm, latDeg } = params;
  const pnHpa = params.pnHpa || 1010;
  const deltaP = Math.max(5, (pnHpa - pcHpa) * 100); // in Pascals (N/m²)
  const rMeters = rKm * 1000;
  const rmaxMeters = rmaxKm * 1000;

  // Coriolis parameter f = 2 * omega * sin(lat)
  const omega = 7.2921e-5;
  const f = Math.abs(2 * omega * Math.sin((latDeg * Math.PI) / 180));

  const B = calculateHollandB(vmaxKt, pcHpa, latDeg);

  // Holland 1980 gradient wind formula:
  // V_g(r) = sqrt( (B / rho) * (Rmax / r)^B * deltaP * exp(-(Rmax / r)^B) + (r * f / 2)^2 ) - (r * f / 2)
  const ratio = rmaxMeters / rMeters;
  const ratioPowerB = Math.pow(ratio, B);
  const term1 = (B / RHO_AIR) * ratioPowerB * deltaP * Math.exp(-ratioPowerB);
  const term2 = Math.pow((rMeters * f) / 2, 2);

  const vGradMs = Math.sqrt(Math.max(0, term1 + term2)) - (rMeters * f) / 2;
  // Reduce gradient wind to 10-meter surface wind (standard reduction factor 0.82-0.85 over sea)
  const vSurfaceMs = Math.max(0, vGradMs * 0.85);

  return Math.round(vSurfaceMs * MS_TO_KT);
}

/**
 * Find radial distance (in km) where wind drops to target speed (e.g. 34kt, 50kt, 64kt)
 */
export function findWindRadius(targetWindKt: number, params: HollandParams): number {
  if (params.vmaxKt < targetWindKt) return 0;

  // Binary search outward from Rmax
  let low = params.rmaxKm;
  let high = 600; // max reasonable radius in km
  let best = params.rmaxKm;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const wind = calculateWindAtRadius(mid, params);
    if (wind >= targetWindKt) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round(best);
}

/**
 * Compute the 34kt (gale), 50kt (storm), and 64kt (hurricane-force) radii
 */
export function calculateWindRadii(params: HollandParams): WindRadii {
  return {
    r34KtKm: findWindRadius(34, params),
    r50KtKm: findWindRadius(50, params),
    r64KtKm: findWindRadius(64, params),
  };
}

/**
 * Great-circle distance between two coordinates in kilometers (Haversine)
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
