import { CriticalAsset, GridCell } from '../types';

/**
 * Generate synthetic 20x20 elevation & coastal grid for a given landfall coordinate
 */
export function generateFallbackGrid(landfallLat: number, landfallLng: number, isAmphan: boolean = false): GridCell[][] {
  const size = 20;
  const grid: GridCell[][] = [];
  // Grid covers approx 40km x 40km box (delta ~0.36 degrees)
  const latStart = landfallLat - 0.18;
  const lngStart = landfallLng - 0.18;
  const step = 0.36 / (size - 1);

  for (let y = 0; y < size; y++) {
    const row: GridCell[] = [];
    const cellLat = latStart + y * step;

    for (let x = 0; x < size; x++) {
      const cellLng = lngStart + x * step;

      // Approximate Bay of Bengal coastline orientation
      // For Odisha: coast runs SW to NE (roughly lat ~ lng offset)
      // For Bengal: coast runs east-west with islands/deltas
      const distFromCoastRel = isAmphan
        ? (cellLat - landfallLat) * 80 + (cellLng - landfallLng) * 20
        : (cellLat - landfallLat) * 60 - (cellLng - landfallLng) * 60;

      const isSea = distFromCoastRel < -2;
      const distCoastKm = isSea ? 0 : Math.max(0.5, Math.abs(distFromCoastRel));

      // Elevation: sea is 0m, coastal ridge 1.5 - 4.5m, inland slowly rises to 8-18m
      let elevationM = 0;
      if (!isSea) {
        // Bengal Sundarbans is lower (0.8m to 3.5m), Odisha is 1.8m to 9m
        const baseElev = isAmphan ? 1.0 : 2.5;
        const slope = isAmphan ? 0.15 : 0.45;
        // Add subtle natural undulation
        const undulation = Math.sin(x * 0.8) * Math.cos(y * 0.8) * (isAmphan ? 0.6 : 1.2);
        elevationM = Number(Math.max(0.6, baseElev + distCoastKm * slope + undulation).toFixed(1));
      }

      // Manning roughness: 0.02 (water), 0.035 (agricultural fields), 0.05 (saline scrub/polders), 0.07 (mangroves/urban)
      const roughness = isSea ? 0.02 : isAmphan ? 0.065 : 0.042;
      // Population density: ~400 to 1200 people/km²
      const populationDensity = isSea ? 0 : Math.round(550 + Math.sin(x * 1.2) * 350 + (20 - y) * 15);

      row.push({
        x,
        y,
        lat: Number(cellLat.toFixed(4)),
        lng: Number(cellLng.toFixed(4)),
        elevationM,
        distCoastKm: Number(distCoastKm.toFixed(1)),
        isSea,
        roughness,
        surgeHeightM: 0,
        floodDepthM: 0,
        isFlooded: false,
        rainfallAccumulationMm: 0,
        populationDensity,
      });
    }
    grid.push(row);
  }

  return grid;
}

/**
 * High-fidelity Critical Infrastructure assets for Odisha (Puri / Brahmagiri / Bhubaneswar corridor)
 */
export const FALLBACK_ASSETS_FANI: CriticalAsset[] = [
  {
    id: 'sub_puri_grid_132kv',
    name: 'Puri 132/33kV Main Grid Substation',
    type: 'substation',
    lat: 19.822,
    lng: 85.845,
    zone: 'Puri Municipality Ward 4',
    elevationM: 2.8,
    distCoastKm: 1.8,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'sub_brahmagiri_33kv',
    name: 'Brahmagiri 33/11kV Rural Substation',
    type: 'substation',
    lat: 19.795,
    lng: 85.675,
    zone: 'Brahmagiri Block Delta',
    elevationM: 1.6,
    distCoastKm: 1.1,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: false,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'sub_balighai_33kv',
    name: 'Balighai 33/11kV Coastal Feeder',
    type: 'substation',
    lat: 19.845,
    lng: 85.92,
    zone: 'Marine Drive Coastal Sector',
    elevationM: 2.1,
    distCoastKm: 0.9,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: false,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'hosp_puri_dhh',
    name: 'Puri District Headquarters Hospital (DHH)',
    type: 'hospital',
    lat: 19.814,
    lng: 85.828,
    zone: 'Grand Road Central',
    capacity: 450, // beds
    elevationM: 4.2,
    distCoastKm: 2.2,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_puri_grid_132kv',
    hasBackupPower: true, // Has 2x 250kVA diesel gensets
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'hosp_brahmagiri_chc',
    name: 'Brahmagiri Community Health Centre (CHC)',
    type: 'hospital',
    lat: 19.798,
    lng: 85.682,
    zone: 'Brahmagiri Block',
    capacity: 60,
    elevationM: 1.9,
    distCoastKm: 1.5,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_brahmagiri_33kv',
    hasBackupPower: false, // Critical dependency on grid!
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'shelter_puri_beach_mcs',
    name: 'Puri Swargadwar Multi-Purpose Cyclone Shelter',
    type: 'shelter',
    lat: 19.799,
    lng: 85.819,
    zone: 'Sea Beach Sector',
    capacity: 2500, // persons
    elevationM: 5.5,
    distCoastKm: 0.4,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_puri_grid_132kv',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'shelter_krushnaprasad_mcs',
    name: 'Krushnaprasad Chilika Island Shelter',
    type: 'shelter',
    lat: 19.742,
    lng: 85.535,
    zone: 'Chilika Lagoon Polder',
    capacity: 1800,
    elevationM: 3.2,
    distCoastKm: 0.8,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_brahmagiri_33kv',
    hasBackupPower: false,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'shelter_balighai_mcs',
    name: 'Balighai Model High School Shelter',
    type: 'shelter',
    lat: 19.851,
    lng: 85.918,
    zone: 'Konark Marine Corridor',
    capacity: 1200,
    elevationM: 4.8,
    distCoastKm: 1.4,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_balighai_33kv',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'road_nh316_puri_highway',
    name: 'National Highway NH-316 (Bhubaneswar-Puri Arterial)',
    type: 'road',
    lat: 19.835,
    lng: 85.839,
    zone: 'Puri Entry Corridor',
    elevationM: 3.4,
    distCoastKm: 3.5,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: true,
    isRoadPassable: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
  {
    id: 'bridge_bhargavi_river',
    name: 'Bhargavi River Tidal Bridge (SH-60)',
    type: 'bridge',
    lat: 19.818,
    lng: 85.765,
    zone: 'Delta Crossing',
    elevationM: 2.9,
    distCoastKm: 2.1,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: {
      hazardScore: 0,
      dependencyScore: 0,
      accessScore: 0,
      weights: { hazard: 0.4, dependency: 0.35, access: 0.25 },
    },
  },
];

/**
 * Fallback Critical Infrastructure for West Bengal / Sundarbans
 */
export const FALLBACK_ASSETS_AMPHAN: CriticalAsset[] = [
  {
    id: 'sub_kakdwip_132kv',
    name: 'Kakdwip 132kV Main Grid Feeder',
    type: 'substation',
    lat: 21.875,
    lng: 88.188,
    zone: 'Kakdwip Subdivision',
    elevationM: 2.2,
    distCoastKm: 4.5,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'sub_sagar_33kv',
    name: 'Sagar Island 33/11kV Substation',
    type: 'substation',
    lat: 21.652,
    lng: 88.085,
    zone: 'Sagar Island Polder',
    elevationM: 1.2,
    distCoastKm: 0.8,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: false,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'hosp_sagar_rh',
    name: 'Sagar Rural Hospital & Maternity Unit',
    type: 'hospital',
    lat: 21.648,
    lng: 88.095,
    zone: 'Sagar South',
    capacity: 120,
    elevationM: 2.4,
    distCoastKm: 1.2,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_sagar_33kv',
    hasBackupPower: false,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'shelter_gangasagar_mcs',
    name: 'Ganga Sagar Pilgrim Mega-Shelter',
    type: 'shelter',
    lat: 21.635,
    lng: 88.055,
    zone: 'Kapil Muni Coastal Sector',
    capacity: 4000,
    elevationM: 4.5,
    distCoastKm: 0.5,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_sagar_33kv',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'road_kakdwip_nh117',
    name: 'NH-117 Diamond Harbour - Kakdwip Highway',
    type: 'road',
    lat: 21.85,
    lng: 88.19,
    zone: 'Inter-Island Causeway',
    elevationM: 1.8,
    distCoastKm: 3.2,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: true,
    isRoadPassable: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
];

/**
 * Fallback Critical Infrastructure for Michaung (Andhra / Bapatla)
 */
export const FALLBACK_ASSETS_MICHAUNG: CriticalAsset[] = [
  {
    id: 'sub_bapatla_132kv',
    name: 'Bapatla 132/33kV Central Substation',
    type: 'substation',
    lat: 15.905,
    lng: 80.468,
    zone: 'Bapatla Urban',
    elevationM: 3.8,
    distCoastKm: 6.2,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'sub_suryalanka_33kv',
    name: 'Suryalanka Beach Feeder Substation',
    type: 'substation',
    lat: 15.862,
    lng: 80.525,
    zone: 'Coastal Tourist Corridor',
    elevationM: 1.9,
    distCoastKm: 0.8,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: false,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'hosp_bapatla_areahosp',
    name: 'Bapatla Area Hospital & Trauma Center',
    type: 'hospital',
    lat: 15.908,
    lng: 80.472,
    zone: 'Town Center',
    capacity: 200,
    elevationM: 4.1,
    distCoastKm: 6.5,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_bapatla_132kv',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'shelter_suryalanka_mcs',
    name: 'Suryalanka Cyclone Shelter & Fishermen Complex',
    type: 'shelter',
    lat: 15.858,
    lng: 80.518,
    zone: 'Suryalanka Beach Front',
    capacity: 1500,
    elevationM: 4.9,
    distCoastKm: 0.5,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    upstreamSubstationId: 'sub_suryalanka_33kv',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
  {
    id: 'bridge_romperu_drain',
    name: 'Romperu Tidal Drain Bridge',
    type: 'bridge',
    lat: 15.882,
    lng: 80.485,
    zone: 'Drainage Channel Crossing',
    elevationM: 2.2,
    distCoastKm: 2.8,
    windExposureKt: 0,
    floodDepthM: 0,
    status: 'safe',
    hasBackupPower: true,
    vulnerabilityIndex: 0,
    vulnerabilityBreakdown: { hazardScore: 0, dependencyScore: 0, accessScore: 0, weights: { hazard: 0.4, dependency: 0.35, access: 0.25 } },
  },
];
