import { ActionPlanItem, CriticalAsset } from '../types';
import { FloodSimulationResult } from './floodFill';
import { CascadeSimulationResult } from './cascade';

export function generateActionPlanForStage(
  currentStageT: number, // e.g. -72, -48, -24, -12, -6, 0
  floodSim: FloodSimulationResult,
  cascadeSim: CascadeSimulationResult
): ActionPlanItem[] {
  const items: ActionPlanItem[] = [];
  const { cascadeSummary, assets } = cascadeSim;

  const failedOrAtRiskSubs = assets.filter(
    (a) => a.type === 'substation' && (a.status === 'failed' || a.status === 'impacted' || a.status === 'at_risk')
  );
  const safeShelters = assets.filter((a) => a.type === 'shelter' && a.status === 'safe');
  const hospitalsNeedingBackup = assets.filter(
    (a) => a.type === 'hospital' && (!a.hasBackupPower || a.status === 'failed' || a.status === 'impacted')
  );

  // Group 1: EVACUATE ACTIONS
  if (currentStageT <= -24) {
    items.push({
      id: `evac-zone-coastal-${currentStageT}`,
      category: 'EVACUATE',
      title: 'Mandatory Evacuation of Coastal Polders & Kutchha Dwellings',
      description: `Order complete evacuation within 5 km of shoreline. Coordinate designated buses towards ${safeShelters.length} identified high-ground shelters.`,
      targetAssetOrZone: 'Coastal Buffer Zone (< 5 km from shore)',
      priority: currentStageT >= -24 ? 'CRITICAL' : 'HIGH',
      authority: 'District Collector & Sub-Divisional Magistrate (SDM)',
      deadlineRelT: 'T-24h (18:00 IST)',
      modelRationale: `Modeled peak surge of ${floodSim.maxFloodDepthM}m with ${floodSim.totalInundatedAreaKm2} km² coastal inundation puts ~${floodSim.totalExposedPopulation.toLocaleString('en-IN')} residents at catastrophic risk.`,
      status: 'in_progress',
      metricsCitation: {
        exposedPop: floodSim.totalExposedPopulation,
        surgeHeightM: floodSim.maxFloodDepthM,
      },
    });
  }

  if (currentStageT >= -48) {
    items.push({
      id: `shelter-capacity-check-${currentStageT}`,
      category: 'EVACUATE',
      title: 'Shelter Roster Activation & Food Ration Stocking',
      description: `Open and sanitize cyclone multi-purpose shelters. Pre-position 72 hours of dry rations, ORS, drinking water tankers, and pregnant women maternity kits.`,
      targetAssetOrZone: 'District Multi-Purpose Cyclone Shelters',
      priority: 'HIGH',
      authority: 'Panchayat & Rural Development / Civil Supplies',
      deadlineRelT: 'T-36h',
      modelRationale: `${safeShelters.length} operational shelters verified above flood contour (>4.5m MSL) with combined intake capacity for vulnerable wards.`,
      status: 'done',
      metricsCitation: {
        dependentCount: safeShelters.length,
      },
    });
  }

  // Group 2: HARDEN ACTIONS
  if (failedOrAtRiskSubs.length > 0) {
    const topSub = failedOrAtRiskSubs[0];
    items.push({
      id: `harden-substation-${topSub.id}`,
      category: 'HARDEN',
      title: `Erect Flood Barriers & Sandbag Berms at ${topSub.name}`,
      description: `Deploy industrial water pumps, sandbag berms to +1.2m above grade, and elevate control room switchgear. Pre-position trailer generator.`,
      targetAssetOrZone: topSub.name,
      priority: 'CRITICAL',
      authority: 'State Power Transmission Utility (OPTCL / TANGEDCO)',
      deadlineRelT: 'T-18h',
      modelRationale: `Substation has modeled flood depth of ${topSub.floodDepthM}m. Substation failure directly trips power to upstream medical hubs and water filtration stations.`,
      status: 'pending',
      metricsCitation: {
        surgeHeightM: topSub.floodDepthM,
        dependentCount: cascadeSummary.impairedHospitals + cascadeSummary.impairedShelters,
      },
    });
  }

  if (hospitalsNeedingBackup.length > 0) {
    const hosp = hospitalsNeedingBackup[0];
    items.push({
      id: `harden-hospital-power-${hosp.id}`,
      category: 'HARDEN',
      title: `Dispatch Auxiliary Diesel Genset (500 kVA) to ${hosp.name}`,
      description: `Ensure redundant emergency power for ICU, neonatal ventilators, and surgical suites. Secure 48-hour fuel bladders.`,
      targetAssetOrZone: hosp.name,
      priority: 'CRITICAL',
      authority: 'Department of Health & Family Welfare / District Medical Officer',
      deadlineRelT: 'T-12h',
      modelRationale: `Facility is dependent on upstream electrical grid at risk of cascading trip. Local wind exposure ${hosp.windExposureKt} kt requires immediate physical hardening.`,
      status: hosp.hasBackupPower ? 'done' : 'in_progress',
      metricsCitation: {
        surgeHeightM: hosp.floodDepthM,
      },
    });
  }

  // Group 3: PRE-POSITION ACTIONS
  items.push({
    id: `preposition-ndrf-teams-${currentStageT}`,
    category: 'PRE-POSITION',
    title: 'Pre-position NDRF / SDRF Search & Rescue Battalions',
    description: `Deploy 6 disaster response battalions equipped with inflatable motor boats (IRBs), tree cutters, and satellite comms at non-flooded elevated road junctions.`,
    targetAssetOrZone: 'Strategic Elevated High-Ground Staging Nodes',
    priority: 'HIGH',
    authority: 'Commandant, NDRF 3rd/4th Battalion & State Disaster Management Authority',
    deadlineRelT: 'T-20h',
    modelRationale: `Simulated flood propagation isolates ${cascadeSummary.cutRoads} major highway arteries. Staging on identified high-ground preserves 15-minute emergency transit corridors.`,
    status: 'in_progress',
    metricsCitation: {
      exposedPop: floodSim.totalExposedPopulation,
      dependentCount: cascadeSummary.cutRoads,
    },
  });

  items.push({
    id: `preposition-fuel-medical-${currentStageT}`,
    category: 'PRE-POSITION',
    title: 'Pre-allocate Mobile Telecom Tower Diesel & HAM Radio Observers',
    description: `Fill telecom cell tower diesel storage to 100%. Dispatch licensed amateur HAM radio volunteer operators to coastal Block Development Offices.`,
    targetAssetOrZone: 'Coastal Block Development Headquarters',
    priority: 'MEDIUM',
    authority: 'Telecom Service Providers (DoT) & Amateur Radio Club',
    deadlineRelT: 'T-14h',
    modelRationale: `Holland profile predicts sustained winds exceeding 64 kt for >18 hours, presenting high risk of optical fiber and microwave mast misalignment.`,
    status: 'pending',
    metricsCitation: {
      surgeHeightM: floodSim.maxFloodDepthM,
    },
  });

  return items;
}

export function computeReadinessPercentage(items: ActionPlanItem[]): number {
  if (items.length === 0) return 100;
  const score = items.reduce((acc, item) => {
    if (item.status === 'done') return acc + 1;
    if (item.status === 'in_progress') return acc + 0.5;
    return acc;
  }, 0);
  return Math.round((score / items.length) * 100);
}
