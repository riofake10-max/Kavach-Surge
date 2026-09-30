import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Wind, Waves, Gauge, Compass, MapPin, CloudRain, Info, RefreshCw } from 'lucide-react';
import { PRESET_SCENARIOS } from '../config/scenarios';
import { calculateHollandB, calculateWindRadii } from '../engine/holland';
import { TidePhase } from '../types';

export const Sidebar: React.FC = () => {
  const {
    scenarioId,
    setScenario,
    activeScenario,
    vmaxKt,
    setIntensity,
    landfallOffsetKm,
    setLandfallOffset,
    forwardSpeedKmH,
    setForwardSpeed,
    tidePhase,
    setTidePhase,
    liveWeather,
    liveMarine,
  } = useAppStore();

  // IMD cyclone classification based on sustained wind (kt)
  const getImdCategory = (vmax: number) => {
    if (vmax >= 120) return { name: 'Super Cyclonic Storm (SuCS)', color: 'text-purple-400', border: 'border-purple-500/40' };
    if (vmax >= 90) return { name: 'Extremely Severe Cyclonic Storm (ESCS)', color: 'text-rose-400', border: 'border-rose-500/40' };
    if (vmax >= 64) return { name: 'Very Severe Cyclonic Storm (VSCS)', color: 'text-red-400', border: 'border-red-500/40' };
    if (vmax >= 48) return { name: 'Severe Cyclonic Storm (SCS)', color: 'text-amber-400', border: 'border-amber-500/40' };
    if (vmax >= 34) return { name: 'Cyclonic Storm (CS)', color: 'text-yellow-400', border: 'border-yellow-500/40' };
    return { name: 'Deep Depression (DD)', color: 'text-blue-400', border: 'border-blue-500/40' };
  };

  const category = getImdCategory(vmaxKt);

  // Compute Holland profile wind radii
  const hollandB = calculateHollandB(vmaxKt, activeScenario.centralPressureHpa, activeScenario.landfallLatLng.lat);
  const radii = calculateWindRadii({
    vmaxKt,
    pcHpa: activeScenario.centralPressureHpa,
    rmaxKm: activeScenario.rmaxKm,
    latDeg: activeScenario.landfallLatLng.lat,
  });

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-y-auto text-xs select-none">
      {/* Scenario Preset Selector */}
      <div className="p-3.5 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <span className="uppercase tracking-wider">Scenario Preset</span>
          <span className="text-cyan-400">{activeScenario.state}</span>
        </div>
        <select
          value={scenarioId}
          onChange={(e) => setScenario(e.target.value as any)}
          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="fani">Fani-like: Odisha coast (Puri)</option>
          <option value="amphan">Amphan-like: West Bengal / Sundarbans</option>
          <option value="michaung">Michaung-like: Chennai / Andhra coast</option>
          <option value="custom">Custom: Interactive Coastal Click</option>
        </select>
        {scenarioId === 'custom' && (
          <p className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-500/30 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Click anywhere on the map coastline to set custom landfall coordinates.
          </p>
        )}
      </div>

      {/* Storm Parametric Sliders */}
      <div className="p-3.5 border-b border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Storm Controls</span>
          <span className={`text-[10px] font-semibold font-mono ${category.color}`}>
            {category.name}
          </span>
        </div>

        {/* Intensity Slider (Vmax) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Intensity (Vmax)</span>
            </span>
            <span className="font-mono font-semibold text-cyan-300 tabular-nums">
              {vmaxKt} kt <span className="text-slate-500 font-normal">({Math.round(vmaxKt * 1.852)} km/h)</span>
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={140}
            step={2}
            value={vmaxKt}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>60 kt (Cat 1)</span>
            <span>100 kt (Cat 3)</span>
            <span>140 kt (Cat 5)</span>
          </div>
        </div>

        {/* Landfall Point Offset */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Landfall Offset</span>
            </span>
            <span className="font-mono tabular-nums text-slate-200">
              {landfallOffsetKm > 0 ? `+${landfallOffsetKm}` : landfallOffsetKm} km
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={5}
            value={landfallOffsetKm}
            onChange={(e) => setLandfallOffset(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>-100 km (South/West)</span>
            <span>0</span>
            <span>+100 km (North/East)</span>
          </div>
        </div>

        {/* Forward Speed */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span>Forward Speed</span>
            <span className="font-mono tabular-nums text-slate-200">{forwardSpeedKmH} km/h</span>
          </div>
          <input
            type="range"
            min={10}
            max={35}
            step={1}
            value={forwardSpeedKmH}
            onChange={(e) => setForwardSpeed(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Astronomical Tide Phase */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-blue-400" />
              <span>Tide Phase at Landfall</span>
            </span>
            <span className="font-mono text-[11px] text-cyan-300">
              {tidePhase === 'low' ? '-0.5 m' : tidePhase === 'high' ? '+1.0 m' : '±0.0 m'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['low', 'mean', 'high'] as TidePhase[]).map((phase) => (
              <button
                key={phase}
                onClick={() => setTidePhase(phase)}
                className={`py-1.5 rounded font-medium capitalize text-center transition-colors ${
                  tidePhase === phase
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Holland (1980) Parametric Wind Field */}
      <div className="p-3.5 border-b border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Holland (1980) Wind Radii</span>
          <span className="text-[10px] font-mono text-cyan-400">B = {hollandB}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-amber-400 font-semibold">R34 (Gale)</div>
            <div className="text-sm font-bold text-slate-100 tabular-nums">{radii.r34KtKm} km</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-orange-400 font-semibold">R50 (Storm)</div>
            <div className="text-sm font-bold text-slate-100 tabular-nums">{radii.r50KtKm} km</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-red-400 font-semibold">R64 (Hurricane)</div>
            <div className="text-sm font-bold text-slate-100 tabular-nums">{radii.r64KtKm} km</div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <span>Rmax: {activeScenario.rmaxKm} km</span>
          <span>Central P: {activeScenario.centralPressureHpa} hPa</span>
        </div>
      </div>

      {/* Live Met Feed Card */}
      <div className="p-3.5 space-y-2 mt-auto">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Live Ingested Met Feed</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            {liveWeather?.source === 'live' ? 'LIVE SYNC' : 'CACHED / FALLBACK'}
          </span>
        </div>
        <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" /> Wind (10m)
            </span>
            <span className="tabular-nums font-semibold">{liveWeather?.windSpeed10mKmh ?? 68} km/h</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400 flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-blue-400" /> 24h Rain
            </span>
            <span className="tabular-nums font-semibold">{liveWeather?.precipitationMm ?? 35} mm</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400 flex items-center gap-1">
              <Waves className="w-3 h-3 text-indigo-400" /> Offshore Wave H
            </span>
            <span className="tabular-nums font-semibold">{liveMarine?.waveHeightM ?? 4.2} m</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-amber-400" /> Surface Pressure
            </span>
            <span className="tabular-nums font-semibold">{liveWeather?.surfacePressureHpa ?? 992} hPa</span>
          </div>
        </div>
        <p className="text-[9px] text-slate-500 leading-tight">
          Feeds Open-Meteo Forecast & Marine APIs. Auto-cached for resilience during network disruptions.
        </p>
      </div>
    </aside>
  );
};
