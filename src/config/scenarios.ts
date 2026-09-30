import { CycloneScenario, TrackPoint } from '../types';

function generateTrackPoints(
  landfallLat: number,
  landfallLng: number,
  bearingDeg: number,
  forwardSpeedKmH: number,
  landfallVmaxKt: number,
  landfallPressureHpa: number
): TrackPoint[] {
  const points: TrackPoint[] = [];
  // Radian conversion
  const rad = (bearingDeg * Math.PI) / 180;
  // Km per degree latitude ~111km; longitude ~111*cos(lat)
  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos((landfallLat * Math.PI) / 180);

  // Generate for times from -72 to +12 in 3h steps
  for (let t = -72; t <= 12; t += 3) {
    const hoursFromLandfall = t;
    const distanceKm = hoursFromLandfall * forwardSpeedKmH; // negative before landfall (seaward), positive after (inland)
    
    // Approach vector: storm moves along bearing direction toward landfall
    // For t <= 0, storm is at landfall - distance * direction
    const latOffset = (distanceKm * Math.cos(rad)) / kmPerDegLat;
    const lngOffset = (distanceKm * Math.sin(rad)) / kmPerDegLng;

    const lat = landfallLat + latOffset;
    const lng = landfallLng + lngOffset;

    // Intensity evolution: strengthens until landfall (t=0) then rapidly weakens overland
    let vmax: number;
    let pressure: number;
    if (t <= 0) {
      // Intensification curve towards landfall
      const leadFactor = 1 - Math.abs(t) / 72;
      vmax = Math.round(50 + (landfallVmaxKt - 50) * Math.pow(leadFactor, 0.8));
      pressure = Math.round(1005 - (1005 - landfallPressureHpa) * Math.pow(leadFactor, 0.8));
    } else {
      // Post-landfall decay over land
      const decayFactor = Math.exp(-t / 10);
      vmax = Math.round(landfallVmaxKt * decayFactor);
      pressure = Math.round(landfallPressureHpa + (1005 - landfallPressureHpa) * (1 - decayFactor));
    }

    let stageName = `T${t >= 0 ? '+' : ''}${t}h`;
    if (t === -72) stageName = 'T-72h (Alert)';
    else if (t === -48) stageName = 'T-48h (Warning)';
    else if (t === -24) stageName = 'T-24h (Evacuate)';
    else if (t === -12) stageName = 'T-12h (Final Hardening)';
    else if (t === 0) stageName = 'Landfall (T=0)';
    else if (t === 12) stageName = 'T+12h (Post-Landfall)';

    points.push({
      timeHours: t,
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      vmaxKt: Math.max(30, vmax),
      centralPressureHpa: Math.min(1010, pressure),
      stageName,
    });
  }

  return points;
}

export const PRESET_SCENARIOS: Record<string, CycloneScenario> = {
  fani: {
    id: 'fani',
    name: 'Fani-like: Odisha Coast (Puri)',
    region: 'Puri & Jagatsinghpur Districts, Odisha',
    state: 'Odisha',
    defaultLanguage: 'or',
    landfallLatLng: { lat: 19.8135, lng: 85.8312 }, // Puri coast
    approachBearingDeg: 215, // coming from southwest (215°)
    forwardSpeedKmH: 18,
    vmaxKt: 115, // Extremely Severe Cyclonic Storm (Cat 4 equivalent)
    centralPressureHpa: 932,
    rmaxKm: 35,
    shelfSlopeFactor: 1.15,
    syntheticTrack: generateTrackPoints(19.8135, 85.8312, 215, 18, 115, 932),
    description: 'Extremely Severe Cyclonic Storm making landfall near Puri, impacting Chilika Lake, Brahmagiri, and Bhubaneswar corridor with 4.5m peak surge and 200 km/h winds.',
  },
  amphan: {
    id: 'amphan',
    name: 'Amphan-like: West Bengal / Sundarbans',
    region: 'South 24 Parganas & Digha, West Bengal',
    state: 'West Bengal',
    defaultLanguage: 'bn',
    landfallLatLng: { lat: 21.6267, lng: 88.2636 }, // Sundarbans / Sagar Island
    approachBearingDeg: 195, // coming from south-southwest
    forwardSpeedKmH: 22,
    vmaxKt: 125, // Super Cyclonic Storm / Cat 4-5
    centralPressureHpa: 920,
    rmaxKm: 42,
    shelfSlopeFactor: 1.45, // Shallow Bengal shelf creates massive surge amplification
    syntheticTrack: generateTrackPoints(21.6267, 88.2636, 195, 22, 125, 920),
    description: 'Super Cyclone making landfall across the Bengal delta with wide shallow continental shelf causing catastrophic 5.5m+ tidal surge into mangrove and delta settlements.',
  },
  michaung: {
    id: 'michaung',
    name: 'Michaung-like: Chennai / Andhra Coast',
    region: 'Bapatla / Nellore Coast, Andhra Pradesh & North Chennai',
    state: 'Andhra Pradesh',
    defaultLanguage: 'te',
    landfallLatLng: { lat: 15.8904, lng: 80.4578 }, // Bapatla
    approachBearingDeg: 185, // track hugging northward
    forwardSpeedKmH: 14,
    vmaxKt: 90, // Severe Cyclonic Storm
    centralPressureHpa: 968,
    rmaxKm: 48,
    shelfSlopeFactor: 0.95,
    syntheticTrack: generateTrackPoints(15.8904, 80.4578, 185, 14, 90, 968),
    description: 'Slow-moving Severe Cyclonic Storm causing intense 48-hour rainfall inundation, drainage congestion in urban deltas, and 2.5m surge along low-lying agricultural polders.',
  },
};

export function createCustomScenario(landfall: { lat: number; lng: number }): CycloneScenario {
  return {
    id: 'custom',
    name: `Custom Landfall (${landfall.lat.toFixed(2)}°N, ${landfall.lng.toFixed(2)}°E)`,
    region: 'Bay of Bengal Coastal Zone',
    state: 'Eastern Littoral Authority',
    defaultLanguage: 'en',
    landfallLatLng: landfall,
    approachBearingDeg: 200,
    forwardSpeedKmH: 18,
    vmaxKt: 100,
    centralPressureHpa: 950,
    rmaxKm: 38,
    shelfSlopeFactor: 1.1,
    syntheticTrack: generateTrackPoints(landfall.lat, landfall.lng, 200, 18, 100, 950),
    description: 'Custom simulated tropical cyclone trajectory defined by incident commander interactive coordinate selection.',
  };
}
