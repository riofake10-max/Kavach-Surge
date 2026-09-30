import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Waves, ShieldAlert, Users, Map, AlertTriangle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SurgeRiskTab: React.FC = () => {
  const {
    floodSimResult,
    vmaxKt,
    activeScenario,
    tidePhase,
    significantWaveHeightM,
    assumptions,
    setIsAssumptionsOpen,
  } = useAppStore();

  const { maxFloodDepthM, totalInundatedAreaKm2, totalExposedPopulation, highRiskCellCount } = floodSimResult;

  // Breakdown terms
  const deltaP = Math.max(0, assumptions.ambientPressureHpa - activeScenario.centralPressureHpa);
  const ibM = Number((deltaP * assumptions.inverseBarometerFactor).toFixed(2));
  const windM = Number((assumptions.windSetupBaseMultiplier * Math.pow(vmaxKt / 100, 2) * activeScenario.shelfSlopeFactor).toFixed(2));
  const tideM = tidePhase === 'low' ? -0.5 : tidePhase === 'high' ? 1.0 : 0.0;
  const waveM = Number((significantWaveHeightM * assumptions.waveSetupRatio).toFixed(2));
  const totalCoastSurge = Number((ibM + windM + tideM + waveM).toFixed(2));

  // Inland decay chart data (from 0 to 25 km inland)
  const decayData = [
    { km: 0, surge: totalCoastSurge },
    { km: 2, surge: Math.max(0, totalCoastSurge - 2 * assumptions.baseInlandDecayMPerKm * 1.1) },
    { km: 5, surge: Math.max(0, totalCoastSurge - 5 * assumptions.baseInlandDecayMPerKm * 1.15) },
    { km: 10, surge: Math.max(0, totalCoastSurge - 10 * assumptions.baseInlandDecayMPerKm * 1.2) },
    { km: 15, surge: Math.max(0, totalCoastSurge - 15 * assumptions.baseInlandDecayMPerKm * 1.25) },
    { km: 20, surge: Math.max(0, totalCoastSurge - 20 * assumptions.baseInlandDecayMPerKm * 1.3) },
    { km: 25, surge: Math.max(0, totalCoastSurge - 25 * assumptions.baseInlandDecayMPerKm * 1.35) },
  ].map((d) => ({
    dist: `${d.km} km`,
    surge: Number(d.surge.toFixed(2)),
  }));

  return (
    <div className="p-4 space-y-4 text-xs font-sans overflow-y-auto">
      {/* Screening Model Disclaimer Banner */}
      <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold text-amber-300">Screening-Grade Operational Model:</span> Recomputes in real time for pre-landfall resource allocation. Supplement with official hydrodynamic forecasts (INCOIS / IMD).
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase font-mono">Peak Coast Surge</div>
          <div className="text-xl font-bold text-cyan-300 font-mono tabular-nums mt-1">{totalCoastSurge} m</div>
          <div className="text-[10px] text-slate-500 mt-0.5">above high tide</div>
        </div>
        <div className="p-3 rounded bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase font-mono">Inundated Area</div>
          <div className="text-xl font-bold text-blue-300 font-mono tabular-nums mt-1">{totalInundatedAreaKm2} km²</div>
          <div className="text-[10px] text-slate-500 mt-0.5">coastal polder extent</div>
        </div>
        <div className="p-3 rounded bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase font-mono">Exposed Pop (Est)</div>
          <div className="text-xl font-bold text-rose-300 font-mono tabular-nums mt-1">
            {totalExposedPopulation.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">vulnerable residents</div>
        </div>
      </div>

      {/* Surge Formulation Term Breakdown */}
      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
            Coastal Surge Component Breakdown
          </span>
          <button
            onClick={() => setIsAssumptionsOpen(true)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            Edit Formula <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between items-center text-slate-300 p-1.5 rounded bg-slate-950/60">
            <span>Inverse Barometer (ΔP_ib)</span>
            <span className="font-semibold text-cyan-400 tabular-nums">+{ibM} m</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 p-1.5 rounded bg-slate-950/60">
            <span>Wind Setup (V² × Shelf Slope)</span>
            <span className="font-semibold text-cyan-400 tabular-nums">+{windM} m</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 p-1.5 rounded bg-slate-950/60">
            <span>Astronomical Tide Phase ({tidePhase})</span>
            <span className="font-semibold text-cyan-400 tabular-nums">{tideM >= 0 ? `+${tideM}` : tideM} m</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 p-1.5 rounded bg-slate-950/60">
            <span>Surf Zone Wave Setup (0.18 × Hs)</span>
            <span className="font-semibold text-cyan-400 tabular-nums">+{waveM} m</span>
          </div>
          <div className="flex justify-between items-center text-slate-100 p-1.5 rounded bg-cyan-950/30 border border-cyan-500/30 font-bold">
            <span>Total Coastal Water Level</span>
            <span className="text-cyan-300 text-sm tabular-nums">{totalCoastSurge} m</span>
          </div>
        </div>
      </div>

      {/* Inland Surge Propagation & Attenuation Chart */}
      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
          Inland Surge Attenuation Gradient
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Decays with distance from coastline at ~{assumptions.baseInlandDecayMPerKm} m/km, scaled by Manning roughness.
        </p>

        <div className="h-36 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={decayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="surgeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dist" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="m" />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="surge" stroke="#22d3ee" fillOpacity={1} fill="url(#surgeGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
