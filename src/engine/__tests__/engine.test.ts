import { calculateHollandB, calculateWindAtRadius, calculateWindRadii } from '../holland';
import { calculateCoastalSurge, calculateInlandSurge } from '../surge';
import { evaluateParametricTriggers } from '../parametric';

export function runEngineSelfTest(): { name: string; passed: boolean; message: string }[] {
  const tests: { name: string; passed: boolean; message: string }[] = [];

  // Test 1: Holland B parameter
  const B = calculateHollandB(115, 932, 19.8);
  const test1Passed = B >= 1.1 && B <= 2.5;
  tests.push({
    name: 'Holland B parameter within realistic bounds (1.1 - 2.5)',
    passed: test1Passed,
    message: `Calculated B = ${B}`,
  });

  // Test 2: Wind speed at radius (Rmax has max wind)
  const vmax = 115;
  const rmax = 35;
  const windAtRmax = calculateWindAtRadius(rmax, {
    vmaxKt: vmax,
    pcHpa: 932,
    rmaxKm: rmax,
    latDeg: 19.8,
  });
  const windFar = calculateWindAtRadius(250, {
    vmaxKt: vmax,
    pcHpa: 932,
    rmaxKm: rmax,
    latDeg: 19.8,
  });
  const test2Passed = windAtRmax > windFar && windFar < 50;
  tests.push({
    name: 'Holland Wind Profile Decays Outward from Rmax',
    passed: test2Passed,
    message: `Wind at ${rmax}km: ${windAtRmax} kt, Wind at 250km: ${windFar} kt`,
  });

  // Test 3: Surge calculation
  const surgeResult = calculateCoastalSurge({
    vmaxKt: 115,
    centralPressureHpa: 932,
    shelfSlopeFactor: 1.15,
    tidePhase: 'high',
    significantWaveHeightM: 4.5,
  });
  const test3Passed = surgeResult.peakSurgeCoastM >= 3.5 && surgeResult.peakSurgeCoastM <= 6.5;
  tests.push({
    name: 'Coastal Surge Height Calculation within Physical Envelope',
    passed: test3Passed,
    message: `Peak Coastal Surge: ${surgeResult.peakSurgeCoastM} m (${surgeResult.formulaDescription})`,
  });

  // Test 4: Inland surge decay
  const coastSurge = 4.5;
  const inland5km = calculateInlandSurge(coastSurge, 5, 0.04);
  const inland25km = calculateInlandSurge(coastSurge, 25, 0.04);
  const test4Passed = inland5km < coastSurge && inland25km < inland5km;
  tests.push({
    name: 'Inland Surge Attenuation with Distance',
    passed: test4Passed,
    message: `Coast: ${coastSurge}m, 5km inland: ${inland5km}m, 25km inland: ${inland25km}m`,
  });

  // Test 5: Parametric Triggers
  const parametric = evaluateParametricTriggers(115, 4.5, 220, 250);
  const test5Passed = parametric.overallStatus === 'triggered' && parametric.payoutPercent === 100;
  tests.push({
    name: 'Parametric Insurance Trigger Payout Evaluation',
    passed: test5Passed,
    message: `Overall Status: ${parametric.overallStatus}, Payout: ₹${parametric.estimatedPayoutCrores} Cr (${parametric.payoutPercent}%)`,
  });

  return tests;
}
