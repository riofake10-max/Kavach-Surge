import { create } from 'zustand';
import {
  CycloneScenario,
  ScenarioId,
  TidePhase,
  GridCell,
  CriticalAsset,
  ActionPlanItem,
  AdvisoryMessage,
  DataSourceStatus,
  InteropModelParams,
} from '../types';
import { PRESET_SCENARIOS, createCustomScenario } from '../config/scenarios';
import {
  SurgeModelAssumptions,
  DEFAULT_SURGE_ASSUMPTIONS,
  calculateCoastalSurge,
} from '../engine/surge';
import { simulateFloodField, FloodSimulationResult } from '../engine/floodFill';
import {
  simulateInfrastructureCascades,
  CascadeSimulationResult,
} from '../engine/cascade';
import { calculateWindRadii, HollandParams } from '../engine/holland';
import { generateActionPlanForStage, computeReadinessPercentage } from '../engine/planner';
import { evaluateParametricTriggers, ParametricState } from '../engine/parametric';
import { fetchLiveWeather, WeatherForecast } from '../adapters/openMeteo';
import { fetchLiveMarine, MarineConditions } from '../adapters/marine';
import { fetchElevationGrid } from '../adapters/elevation';
import { fetchInfrastructureAssets } from '../adapters/overpass';
import { generateAiAdvisories } from '../ai/advisories';
import { ImageVulnerabilityAssessment } from '../ai/vulnerabilityImage';

export interface AppState {
  scenarioId: ScenarioId;
  activeScenario: CycloneScenario;
  timeHours: number; // -72 to +12
  isPlaying: boolean;
  vmaxKt: number;
  landfallOffsetKm: number;
  forwardSpeedKmH: number;
  tidePhase: TidePhase;
  precipitationForecastMm: number;
  significantWaveHeightM: number;
  assumptions: SurgeModelAssumptions;
  activeTab: 'surge_risk' | 'cascades' | 'planner' | 'parametric' | 'analyst' | 'advisories' | 'interop' | 'brief';
  selectedAsset: CriticalAsset | null;
  isAssumptionsOpen: boolean;
  isDataSourcesOpen: boolean;
  isMultimodalOpen: boolean;
  selectedAssetForImage: CriticalAsset | null;
  mapLayerToggles: {
    floodOverlay: boolean;
    rainfallPooling: boolean;
    windRadii: boolean;
    cascades: boolean;
    satelliteBasemap: boolean;
  };
  language: string;

  // Real data state
  dataSources: Record<string, DataSourceStatus>;
  liveWeather: WeatherForecast | null;
  liveMarine: MarineConditions | null;
  rawGrid: GridCell[][];
  rawAssets: CriticalAsset[];

  // Computed outputs
  floodSimResult: FloodSimulationResult;
  cascadeSimResult: CascadeSimulationResult;
  actionPlan: ActionPlanItem[];
  readinessPct: number;
  parametricState: ParametricState;
  advisories: AdvisoryMessage[];
  dispatchedLogs: Array<{
    id: string;
    time: string;
    channel: string;
    language: string;
    audience: string;
    recipients: number;
  }>;

  // Guided demo walkthrough
  isDemoRunning: boolean;
  demoStepIndex: number;

  // Actions
  setScenario: (id: ScenarioId) => Promise<void>;
  setCustomLandfall: (latLng: { lat: number; lng: number }) => Promise<void>;
  setTimeHours: (t: number) => void;
  togglePlay: () => void;
  setIntensity: (vmaxKt: number) => void;
  setLandfallOffset: (km: number) => void;
  setForwardSpeed: (kmH: number) => void;
  setTidePhase: (phase: TidePhase) => void;
  updateAssumptions: (assumptions: Partial<SurgeModelAssumptions>) => void;
  toggleBackupPower: (assetId: string, hasBackup: boolean) => void;
  selectAsset: (asset: CriticalAsset | null) => void;
  toggleLayer: (layerName: keyof AppState['mapLayerToggles']) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setLanguage: (lang: string) => void;
  setIsAssumptionsOpen: (open: boolean) => void;
  setIsDataSourcesOpen: (open: boolean) => void;
  setIsMultimodalOpen: (open: boolean, asset?: CriticalAsset) => void;
  approveAdvisory: (id: string) => void;
  dispatchAdvisory: (id: string, channel: string) => void;
  updateActionStatus: (id: string, status: ActionPlanItem['status']) => void;
  applyAiImageAssessment: (assetId: string, assessment: ImageVulnerabilityAssessment) => void;
  applyInteropParams: (params: InteropModelParams) => void;
  startDemo: () => void;
  stopDemo: () => void;
  nextDemoStep: () => void;
  recomputeAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const initialScenario = PRESET_SCENARIOS.fani;

  return {
    scenarioId: 'fani',
    activeScenario: initialScenario,
    timeHours: -24, // Start at alert/evacuate stage
    isPlaying: false,
    vmaxKt: initialScenario.vmaxKt,
    landfallOffsetKm: 0,
    forwardSpeedKmH: initialScenario.forwardSpeedKmH,
    tidePhase: 'mean',
    precipitationForecastMm: 210,
    significantWaveHeightM: 4.5,
    assumptions: { ...DEFAULT_SURGE_ASSUMPTIONS },
    activeTab: 'surge_risk',
    selectedAsset: null,
    isAssumptionsOpen: false,
    isDataSourcesOpen: false,
    isMultimodalOpen: false,
    selectedAssetForImage: null,
    mapLayerToggles: {
      floodOverlay: true,
      rainfallPooling: false,
      windRadii: true,
      cascades: true,
      satelliteBasemap: false,
    },
    language: 'or', // Default Odia for Fani

    dataSources: {
      weather: { name: 'Open-Meteo Forecast API', status: 'loading' },
      marine: { name: 'Open-Meteo Marine API', status: 'loading' },
      elevation: { name: 'Open-Meteo Elevation API', status: 'loading' },
      infrastructure: { name: 'OSM Overpass Infrastructure API', status: 'loading' },
      satellite: { name: 'GEE Satellite Provider (Sample Layer)', status: 'live', details: 'Sentinel-1/2 Precomputed' },
    },
    liveWeather: null,
    liveMarine: null,
    rawGrid: [],
    rawAssets: [],

    floodSimResult: {
      grid: [],
      maxFloodDepthM: 0,
      totalInundatedAreaKm2: 0,
      totalExposedPopulation: 0,
      highRiskCellCount: 0,
    },
    cascadeSimResult: {
      assets: [],
      cascadeSummary: {
        failedSubstations: 0,
        impairedHospitals: 0,
        impairedShelters: 0,
        cutRoads: 0,
        flaggedBridges: 0,
        totalPopulationAffected: 0,
        headline: '',
      },
      nodeImpacts: [],
      dependencyLines: [],
    },
    actionPlan: [],
    readinessPct: 65,
    parametricState: {
      portfolioSumInsuredCrores: 250,
      triggers: [],
      overallStatus: 'not_triggered',
      payoutPercent: 0,
      estimatedPayoutCrores: 0,
      recommendedReleaseStage: '',
      basisRiskNote: '',
    },
    advisories: [],
    dispatchedLogs: [],

    isDemoRunning: false,
    demoStepIndex: 0,

    setScenario: async (id: ScenarioId) => {
      const scenario = PRESET_SCENARIOS[id] || PRESET_SCENARIOS.fani;
      set({
        scenarioId: id,
        activeScenario: scenario,
        vmaxKt: scenario.vmaxKt,
        forwardSpeedKmH: scenario.forwardSpeedKmH,
        landfallOffsetKm: 0,
        language: scenario.defaultLanguage,
        timeHours: -24,
      });

      const { lat, lng } = scenario.landfallLatLng;
      const isAmphan = id === 'amphan';

      // Update data sources status
      set((s) => ({
        dataSources: {
          ...s.dataSources,
          weather: { ...s.dataSources.weather, status: 'loading' },
          marine: { ...s.dataSources.marine, status: 'loading' },
          elevation: { ...s.dataSources.elevation, status: 'loading' },
          infrastructure: { ...s.dataSources.infrastructure, status: 'loading' },
        },
      }));

      // Ingest live/cached data feeds in parallel
      const [weather, marine, elevResult, infraResult] = await Promise.all([
        fetchLiveWeather(lat, lng),
        fetchLiveMarine(lat, lng),
        fetchElevationGrid(lat, lng, isAmphan),
        fetchInfrastructureAssets(id, lat, lng),
      ]);

      set((s) => ({
        liveWeather: weather,
        liveMarine: marine,
        rawGrid: elevResult.grid,
        rawAssets: infraResult.assets,
        precipitationForecastMm: Math.max(160, Math.round(weather.precipitationMm * 4.5)),
        significantWaveHeightM: marine.waveHeightM,
        dataSources: {
          ...s.dataSources,
          weather: {
            name: 'Open-Meteo Forecast API',
            status: weather.source,
            lastUpdated: weather.timestamp,
            details: `${weather.windSpeed10mKmh} km/h wind, ${weather.precipitationMm} mm rain`,
          },
          marine: {
            name: 'Open-Meteo Marine API',
            status: marine.source,
            details: `${marine.waveHeightM}m wave height, ${marine.wavePeriodS}s period`,
          },
          elevation: {
            name: 'Open-Meteo Elevation API',
            status: elevResult.source,
            details: '20x20 batched coastal topography grid (~400 nodes)',
          },
          infrastructure: {
            name: 'OSM Overpass Infrastructure API',
            status: infraResult.source,
            details: `${infraResult.assets.length} critical assets loaded in 25km buffer`,
          },
        },
      }));

      get().recomputeAll();
    },

    setCustomLandfall: async (latLng: { lat: number; lng: number }) => {
      const scenario = createCustomScenario(latLng);
      set({
        scenarioId: 'custom',
        activeScenario: scenario,
        vmaxKt: scenario.vmaxKt,
        timeHours: -24,
      });

      const [weather, marine, elevResult, infraResult] = await Promise.all([
        fetchLiveWeather(latLng.lat, latLng.lng),
        fetchLiveMarine(latLng.lat, latLng.lng),
        fetchElevationGrid(latLng.lat, latLng.lng),
        fetchInfrastructureAssets('custom', latLng.lat, latLng.lng),
      ]);

      set({
        liveWeather: weather,
        liveMarine: marine,
        rawGrid: elevResult.grid,
        rawAssets: infraResult.assets,
      });

      get().recomputeAll();
    },

    setTimeHours: (t: number) => {
      set({ timeHours: t });
      get().recomputeAll();
    },

    togglePlay: () => {
      set((s) => ({ isPlaying: !s.isPlaying }));
    },

    setIntensity: (vmaxKt: number) => {
      set({ vmaxKt });
      get().recomputeAll();
    },

    setLandfallOffset: (km: number) => {
      set({ landfallOffsetKm: km });
      get().recomputeAll();
    },

    setForwardSpeed: (kmH: number) => {
      set({ forwardSpeedKmH: kmH });
      get().recomputeAll();
    },

    setTidePhase: (phase: TidePhase) => {
      set({ tidePhase: phase });
      get().recomputeAll();
    },

    updateAssumptions: (assump) => {
      set((s) => ({ assumptions: { ...s.assumptions, ...assump } }));
      get().recomputeAll();
    },

    toggleBackupPower: (assetId: string, hasBackup: boolean) => {
      set((s) => ({
        rawAssets: s.rawAssets.map((a) => (a.id === assetId ? { ...a, hasBackupPower: hasBackup } : a)),
        selectedAsset: s.selectedAsset?.id === assetId ? { ...s.selectedAsset, hasBackupPower: hasBackup } : s.selectedAsset,
      }));
      get().recomputeAll();
    },

    selectAsset: (asset) => set({ selectedAsset: asset }),
    toggleLayer: (name) =>
      set((s) => ({
        mapLayerToggles: { ...s.mapLayerToggles, [name]: !s.mapLayerToggles[name] },
      })),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setLanguage: (lang) => {
      set({ language: lang });
      // Refresh advisories for this language
      const s = get();
      generateAiAdvisories(
        s.activeScenario.name,
        s.activeScenario.region,
        s.vmaxKt,
        s.floodSimResult.maxFloodDepthM,
        [lang]
      ).then((advisories) => set({ advisories }));
    },
    setIsAssumptionsOpen: (open) => set({ isAssumptionsOpen: open }),
    setIsDataSourcesOpen: (open) => set({ isDataSourcesOpen: open }),
    setIsMultimodalOpen: (open, asset) => set({ isMultimodalOpen: open, selectedAssetForImage: asset || null }),

    approveAdvisory: (id: string) => {
      set((s) => ({
        advisories: s.advisories.map((a) => (a.id === id ? { ...a, approvedByOfficer: true } : a)),
      }));
    },

    dispatchAdvisory: (id: string, channel: string) => {
      const adv = get().advisories.find((a) => a.id === id);
      if (!adv) return;

      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      set((s) => ({
        advisories: s.advisories.map((a) => (a.id === id ? { ...a, dispatchedAt: now } : a)),
        dispatchedLogs: [
          {
            id: `log_${Date.now()}`,
            time: now,
            channel,
            language: adv.language,
            audience: adv.audienceLabel,
            recipients: adv.recipientsEstimate,
          },
          ...s.dispatchedLogs,
        ],
      }));
    },

    updateActionStatus: (id: string, status: ActionPlanItem['status']) => {
      set((s) => {
        const updatedPlan = s.actionPlan.map((item) => (item.id === id ? { ...item, status } : item));
        return {
          actionPlan: updatedPlan,
          readinessPct: computeReadinessPercentage(updatedPlan),
        };
      });
    },

    applyAiImageAssessment: (assetId: string, assessment: ImageVulnerabilityAssessment) => {
      set((s) => ({
        rawAssets: s.rawAssets.map((a) =>
          a.id === assetId
            ? {
                ...a,
                aiAssessedScore: assessment.vulnerability_score_0_100,
                aiAssessmentNotes: assessment.reasoning,
              }
            : a
        ),
      }));
      get().recomputeAll();
    },

    applyInteropParams: (params: InteropModelParams) => {
      set((s) => ({
        activeScenario: {
          ...s.activeScenario,
          shelfSlopeFactor: params.shelfSlopeFactor,
        },
        assumptions: {
          ...s.assumptions,
          windSetupBaseMultiplier: params.windSetupMultiplier,
          inverseBarometerFactor: params.pressureDecayCoeff,
          baseInlandDecayMPerKm: params.inlandDecayRatePerKm,
        },
      }));
      get().recomputeAll();
    },

    startDemo: () => {
      set({ isDemoRunning: true, demoStepIndex: 0, scenarioId: 'fani' });
      get().setScenario('fani');
    },

    stopDemo: () => {
      set({ isDemoRunning: false });
    },

    nextDemoStep: () => {
      set((s) => ({ demoStepIndex: s.demoStepIndex + 1 }));
    },

    recomputeAll: () => {
      const s = get();
      const {
        activeScenario,
        vmaxKt,
        timeHours,
        tidePhase,
        significantWaveHeightM,
        precipitationForecastMm,
        assumptions,
        rawGrid,
        rawAssets,
      } = s;

      // 1. Current storm position along synthetic track based on timeHours
      const track = activeScenario.syntheticTrack;
      // Interpolate closest track point
      let currentTrackPoint = track[0];
      let minDiff = Infinity;
      for (const p of track) {
        const diff = Math.abs(p.timeHours - timeHours);
        if (diff < minDiff) {
          minDiff = diff;
          currentTrackPoint = p;
        }
      }

      // Compute effective intensity at this time step
      // When at landfall (timeHours=0), it matches user slider vmaxKt
      const timeScale = currentTrackPoint.vmaxKt / activeScenario.vmaxKt;
      const effectiveVmaxKt = Math.round(vmaxKt * timeScale);
      const effectivePressure = currentTrackPoint.centralPressureHpa;

      // 2. Coastal storm surge
      const surgeResult = calculateCoastalSurge({
        vmaxKt: effectiveVmaxKt,
        centralPressureHpa: effectivePressure,
        shelfSlopeFactor: activeScenario.shelfSlopeFactor,
        tidePhase,
        significantWaveHeightM,
        assumptions,
      });

      // 3. Flood Fill and Flow Accumulation
      const floodSimResult = simulateFloodField(
        rawGrid,
        surgeResult.peakSurgeCoastM,
        precipitationForecastMm,
        assumptions
      );

      // 4. Infrastructure exposure and cascades
      const hollandParams: HollandParams = {
        vmaxKt: effectiveVmaxKt,
        pcHpa: effectivePressure,
        rmaxKm: activeScenario.rmaxKm,
        latDeg: currentTrackPoint.lat,
      };

      const cascadeSimResult = simulateInfrastructureCascades(
        rawAssets,
        floodSimResult.grid,
        { lat: currentTrackPoint.lat, lng: currentTrackPoint.lng },
        hollandParams
      );

      // 5. T-Minus Action Planner items
      const actionPlan = generateActionPlanForStage(timeHours, floodSimResult, cascadeSimResult);
      const readinessPct = computeReadinessPercentage(actionPlan);

      // 6. Parametric triggers
      const parametricState = evaluateParametricTriggers(
        effectiveVmaxKt,
        surgeResult.peakSurgeCoastM,
        precipitationForecastMm,
        s.parametricState.portfolioSumInsuredCrores
      );

      set({
        floodSimResult,
        cascadeSimResult,
        actionPlan,
        readinessPct,
        parametricState,
      });

      // If advisories empty, draft initial set
      if (s.advisories.length === 0) {
        generateAiAdvisories(
          activeScenario.name,
          activeScenario.region,
          effectiveVmaxKt,
          surgeResult.peakSurgeCoastM,
          [s.language]
        ).then((advisories) => set({ advisories }));
      }
    },
  };
});
