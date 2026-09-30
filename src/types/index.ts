export type ScenarioId = 'fani' | 'amphan' | 'michaung' | 'custom';

export type TidePhase = 'low' | 'mean' | 'high';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrackPoint {
  timeHours: number; // e.g. -72, -48, ..., 0 (landfall), +12
  lat: number;
  lng: number;
  vmaxKt: number;
  centralPressureHpa: number;
  stageName: string;
}

export interface CycloneScenario {
  id: ScenarioId;
  name: string;
  region: string;
  state: string;
  defaultLanguage: 'or' | 'bn' | 'te' | 'ta' | 'hi' | 'en';
  landfallLatLng: LatLng;
  approachBearingDeg: number;
  forwardSpeedKmH: number;
  vmaxKt: number;
  centralPressureHpa: number;
  rmaxKm: number;
  shelfSlopeFactor: number; // Regional shelf slope: e.g. Bengal shelf is very shallow (1.4), Odisha (1.1), Tamil Nadu (0.8)
  syntheticTrack: TrackPoint[];
  description: string;
}

export interface GridCell {
  x: number; // 0..gridWidth-1
  y: number; // 0..gridHeight-1
  lat: number;
  lng: number;
  elevationM: number;
  distCoastKm: number;
  isSea: boolean;
  roughness: number; // Manning roughness equivalent 0.02 - 0.08
  surgeHeightM: number;
  floodDepthM: number;
  isFlooded: boolean;
  rainfallAccumulationMm: number;
  populationDensity: number; // est people/km²
}

export type AssetType = 'hospital' | 'substation' | 'shelter' | 'police' | 'fire' | 'road' | 'bridge';

export type AssetStatus = 'safe' | 'at_risk' | 'impacted' | 'failed';

export interface CriticalAsset {
  id: string;
  name: string;
  type: AssetType;
  lat: number;
  lng: number;
  zone: string;
  capacity?: number; // e.g., hospital beds or shelter people capacity
  elevationM: number;
  distCoastKm: number;
  windExposureKt: number;
  floodDepthM: number;
  status: AssetStatus;
  upstreamSubstationId?: string;
  hasBackupPower: boolean;
  isRoadPassable?: boolean;
  aiAssessedScore?: number;
  aiAssessmentNotes?: string;
  vulnerabilityIndex: number; // 0 - 100
  vulnerabilityBreakdown: {
    hazardScore: number;
    dependencyScore: number;
    accessScore: number;
    weights: { hazard: number; dependency: number; access: number };
  };
}

export interface CascadeNodeImpact {
  substationId: string;
  substationName: string;
  dependentHospitals: string[];
  dependentShelters: string[];
  totalPopulationAffected: number;
  isFailureCausedBySurge: boolean;
}

export interface ActionPlanItem {
  id: string;
  category: 'EVACUATE' | 'HARDEN' | 'PRE-POSITION';
  title: string;
  description: string;
  targetAssetOrZone: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  authority: string;
  deadlineRelT: string;
  modelRationale: string;
  status: 'pending' | 'in_progress' | 'done';
  metricsCitation: {
    exposedPop?: number;
    surgeHeightM?: number;
    dependentCount?: number;
  };
}

export interface ParametricTrigger {
  id: string;
  name: string;
  metric: 'sustained_wind_kt' | 'coastal_surge_m' | 'rainfall_24h_mm';
  threshold: number;
  currentValue: number;
  unit: string;
  status: 'not_triggered' | 'watch' | 'triggered';
  payoutPercent: number; // 0, 25, 50, 100
}

export interface AdvisoryMessage {
  id: string;
  audience: 'fishermen' | 'urban' | 'hospitals' | 'power_utility' | 'district_admin' | 'transport';
  audienceLabel: string;
  warningLevel: 'Yellow' | 'Orange' | 'Red';
  language: string;
  smsText: string;
  whatsAppText: string;
  ivrVoiceScript: string;
  capAlert: {
    identifier: string;
    sender: string;
    sent: string;
    status: 'Actual' | 'Exercise';
    msgType: 'Alert' | 'Update';
    scope: 'Public';
    event: string;
    urgency: string;
    severity: string;
    certainty: string;
    area: string;
    instruction: string;
  };
  approvedByOfficer: boolean;
  dispatchedAt?: string;
  recipientsEstimate: number;
}

export interface InteropModelParams {
  id: string;
  name: string;
  region: string;
  version: string;
  shelfSlopeFactor: number;
  windSetupMultiplier: number;
  pressureDecayCoeff: number;
  inlandDecayRatePerKm: number;
  validationScore: number; // illustrative 0-100
  notes: string;
}

export interface DataSourceStatus {
  name: string;
  status: 'live' | 'cached' | 'fallback' | 'loading' | 'error';
  lastUpdated?: string;
  details?: string;
}
