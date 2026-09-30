import { ParametricTrigger } from '../types';

export interface ParametricState {
  portfolioSumInsuredCrores: number; // default ₹250 Cr
  triggers: ParametricTrigger[];
  overallStatus: 'not_triggered' | 'watch' | 'triggered';
  payoutPercent: number; // 0 to 100
  estimatedPayoutCrores: number;
  recommendedReleaseStage: string;
  basisRiskNote: string;
}

export function evaluateParametricTriggers(
  vmaxKt: number,
  peakSurgeM: number,
  rainfallMm: number,
  portfolioSumInsuredCrores: number = 250
): ParametricState {
  const triggers: ParametricTrigger[] = [
    {
      id: 'wind_trigger',
      name: 'Catastrophic Sustained Wind Index',
      metric: 'sustained_wind_kt',
      threshold: 64, // Hurricane-force threshold
      currentValue: vmaxKt,
      unit: 'kt',
      status: vmaxKt >= 64 ? 'triggered' : vmaxKt >= 50 ? 'watch' : 'not_triggered',
      payoutPercent: vmaxKt >= 100 ? 100 : vmaxKt >= 80 ? 50 : vmaxKt >= 64 ? 25 : 0,
    },
    {
      id: 'surge_trigger',
      name: 'Peak Coastal Tidal Surge Depth',
      metric: 'coastal_surge_m',
      threshold: 1.5,
      currentValue: peakSurgeM,
      unit: 'm',
      status: peakSurgeM >= 1.5 ? 'triggered' : peakSurgeM >= 1.0 ? 'watch' : 'not_triggered',
      payoutPercent: peakSurgeM >= 3.0 ? 100 : peakSurgeM >= 2.0 ? 50 : peakSurgeM >= 1.5 ? 25 : 0,
    },
    {
      id: 'rain_trigger',
      name: '24-Hour Pluvial Rainfall Inundation',
      metric: 'rainfall_24h_mm',
      threshold: 200,
      currentValue: rainfallMm,
      unit: 'mm',
      status: rainfallMm >= 200 ? 'triggered' : rainfallMm >= 140 ? 'watch' : 'not_triggered',
      payoutPercent: rainfallMm >= 350 ? 100 : rainfallMm >= 260 ? 50 : rainfallMm >= 200 ? 25 : 0,
    },
  ];

  // Maximum payout percent across triggers
  const maxPayout = Math.max(...triggers.map((t) => t.payoutPercent));
  const isTriggered = triggers.some((t) => t.status === 'triggered');
  const isWatch = triggers.some((t) => t.status === 'watch');

  const overallStatus: 'not_triggered' | 'watch' | 'triggered' = isTriggered
    ? 'triggered'
    : isWatch
    ? 'watch'
    : 'not_triggered';

  const estimatedPayoutCrores = Number(((portfolioSumInsuredCrores * maxPayout) / 100).toFixed(2));

  return {
    portfolioSumInsuredCrores,
    triggers,
    overallStatus,
    payoutPercent: maxPayout,
    estimatedPayoutCrores,
    recommendedReleaseStage: 'T-24h (Pre-landfall liquidity dispatch to District Emergency Relief Accounts)',
    basisRiskNote:
      'Parametric liquidity relies on verified spatial index triggers (wind/surge/rainfall) rather than lengthy on-site loss adjustment. Basis risk may exist where localized micro-topography incurs structural damage without exceeding the regional index threshold.',
  };
}
