import { TidePhase } from '../types';

export interface SurgeModelAssumptions {
  ambientPressureHpa: number; // default 1010 hPa
  inverseBarometerFactor: number; // ~0.01 m per hPa drop
  windSetupBaseMultiplier: number; // default 2.2
  waveSetupRatio: number; // ~0.18 of significant wave height
  baseInlandDecayMPerKm: number; // default 0.22 m/km
}

export const DEFAULT_SURGE_ASSUMPTIONS: SurgeModelAssumptions = {
  ambientPressureHpa: 1010,
  inverseBarometerFactor: 0.01,
  windSetupBaseMultiplier: 2.2,
  waveSetupRatio: 0.18,
  baseInlandDecayMPerKm: 0.22,
};

export interface CoastalSurgeInputs {
  vmaxKt: number;
  centralPressureHpa: number;
  shelfSlopeFactor: number;
  tidePhase: TidePhase;
  significantWaveHeightM: number;
  assumptions?: Partial<SurgeModelAssumptions>;
}

export interface CoastalSurgeResult {
  peakSurgeCoastM: number;
  inverseBarometerM: number;
  windSetupM: number;
  tideOffsetM: number;
  waveSetupM: number;
  formulaDescription: string;
}

/**
 * Compute total peak storm surge at the coastal boundary
 */
export function calculateCoastalSurge(inputs: CoastalSurgeInputs): CoastalSurgeResult {
  const assumptions = { ...DEFAULT_SURGE_ASSUMPTIONS, ...(inputs.assumptions || {}) };

  // 1. Inverse Barometer Effect: sea level rises ~1 cm per 1 hPa atmospheric pressure drop below ambient
  const deltaP = Math.max(0, assumptions.ambientPressureHpa - inputs.centralPressureHpa);
  const inverseBarometerM = Number((deltaP * assumptions.inverseBarometerFactor).toFixed(2));

  // 2. Wind Setup: proportional to surface wind stress (Vmax²), amplified by shallow continental shelf geometry
  const windFactor = Math.pow(inputs.vmaxKt / 100, 2);
  const windSetupM = Number((assumptions.windSetupBaseMultiplier * windFactor * inputs.shelfSlopeFactor).toFixed(2));

  // 3. Astronomical Tide Offset
  let tideOffsetM = 0;
  if (inputs.tidePhase === 'low') tideOffsetM = -0.5;
  else if (inputs.tidePhase === 'high') tideOffsetM = 1.0;

  // 4. Wave Setup: breaking wave radiation stress gradient in the surf zone
  const waveSetupM = Number((inputs.significantWaveHeightM * assumptions.waveSetupRatio).toFixed(2));

  // Total peak coastal storm surge
  const totalRaw = inverseBarometerM + windSetupM + tideOffsetM + waveSetupM;
  const peakSurgeCoastM = Number(Math.max(0.2, totalRaw).toFixed(2));

  return {
    peakSurgeCoastM,
    inverseBarometerM,
    windSetupM,
    tideOffsetM,
    waveSetupM,
    formulaDescription: `Surge = ΔP_ib (${inverseBarometerM}m) + Wind Setup (${windSetupM}m) + Tide (${tideOffsetM >= 0 ? '+' : ''}${tideOffsetM}m) + Wave Setup (${waveSetupM}m) = ${peakSurgeCoastM}m`,
  };
}

/**
 * Compute local surge height inland at distance d (km) from coast with surface roughness
 */
export function calculateInlandSurge(
  peakSurgeCoastM: number,
  distCoastKm: number,
  roughness: number = 0.04, // 0.02 (smooth salt marsh) to 0.08 (dense mangrove/urban)
  assumptions?: Partial<SurgeModelAssumptions>
): number {
  if (distCoastKm <= 0) return peakSurgeCoastM; // at sea or shoreline

  const baseDecay = (assumptions?.baseInlandDecayMPerKm ?? DEFAULT_SURGE_ASSUMPTIONS.baseInlandDecayMPerKm);
  // Roughness scaling: rougher terrain causes faster attenuation of surge wave energy
  const effectiveDecayRate = baseDecay * (1 + (roughness - 0.03) * 5);
  const attenuatedSurge = peakSurgeCoastM - distCoastKm * effectiveDecayRate;

  return Math.max(0, Number(attenuatedSurge.toFixed(2)));
}
