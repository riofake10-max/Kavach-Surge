import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Printer, Download, FileText, CheckCircle2, AlertOctagon, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ExecutiveBriefTab: React.FC = () => {
  const {
    activeScenario,
    timeHours,
    vmaxKt,
    floodSimResult,
    cascadeSimResult,
    readinessPct,
    parametricState,
    language,
  } = useAppStore();

  const handlePrint = () => {
    window.print();
  };

  // Scenario Comparison Data: Current vs -20kt vs +20kt
  const comparisonData = [
    {
      scenario: `${vmaxKt - 20} kt (Weakened)`,
      surge: Math.max(0.8, Number((floodSimResult.maxFloodDepthM * 0.72).toFixed(1))),
      area: Math.round(floodSimResult.totalInundatedAreaKm2 * 0.65),
      pop: Math.round(floodSimResult.totalExposedPopulation * 0.6),
      failedSubs: Math.max(0, cascadeSimResult.cascadeSummary.failedSubstations - 1),
    },
    {
      scenario: `${vmaxKt} kt (Current Modeled)`,
      surge: floodSimResult.maxFloodDepthM,
      area: floodSimResult.totalInundatedAreaKm2,
      pop: floodSimResult.totalExposedPopulation,
      failedSubs: cascadeSimResult.cascadeSummary.failedSubstations,
    },
    {
      scenario: `${vmaxKt + 20} kt (Intensified)`,
      surge: Number((floodSimResult.maxFloodDepthM * 1.35).toFixed(1)),
      area: Math.round(floodSimResult.totalInundatedAreaKm2 * 1.45),
      pop: Math.round(floodSimResult.totalExposedPopulation * 1.5),
      failedSubs: cascadeSimResult.cascadeSummary.failedSubstations + 2,
    },
  ];

  return (
    <div className="p-4 space-y-4 text-xs font-sans overflow-y-auto print:p-0 print:text-black">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
            <FileText className="w-4 h-4 text-cyan-400" />
            Executive Pre-Landfall Situation Report (SITREP)
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Generated {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Print / Export PDF
        </button>
      </div>

      {/* Brief Card Container (optimized for PDF printing) */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3.5 print:bg-white print:border-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 print:border-black">
          <div>
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">STATE EMERGENCY OPERATIONS CENTRE</span>
            <h2 className="text-base font-bold text-slate-100 print:text-black">{activeScenario.name}</h2>
            <div className="text-[11px] text-slate-400 print:text-gray-600 font-mono">
              Target Coastline: {activeScenario.region} · Stage: T{timeHours >= 0 ? '+' : ''}{timeHours}h
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-1 rounded bg-red-950/80 border border-red-500/40 text-red-300 font-mono font-bold text-xs">
              VERY SEVERE WARNING
            </span>
          </div>
        </div>

        {/* 5 Core SitRep KPIs */}
        <div className="grid grid-cols-5 gap-2 text-center font-mono">
          <div className="p-2 rounded bg-slate-950 border border-slate-800 print:border-gray-300">
            <div className="text-[9px] text-slate-400">EXPOSED POPULATION</div>
            <div className="text-sm font-bold text-slate-100 print:text-black tabular-nums mt-0.5">
              {floodSimResult.totalExposedPopulation.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 print:border-gray-300">
            <div className="text-[9px] text-slate-400">PEAK SURGE</div>
            <div className="text-sm font-bold text-cyan-300 print:text-cyan-800 tabular-nums mt-0.5">
              {floodSimResult.maxFloodDepthM} m
            </div>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 print:border-gray-300">
            <div className="text-[9px] text-slate-400">CUT HIGHWAYS</div>
            <div className="text-sm font-bold text-red-400 tabular-nums mt-0.5">
              {cascadeSimResult.cascadeSummary.cutRoads}
            </div>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 print:border-gray-300">
            <div className="text-[9px] text-slate-400">OPERATIONAL READINESS</div>
            <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
              {readinessPct}%
            </div>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 print:border-gray-300">
            <div className="text-[9px] text-slate-400">LIQUIDITY TRIGGER</div>
            <div className="text-sm font-bold text-amber-400 tabular-nums mt-0.5">
              {parametricState.overallStatus.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Executive Summary Paragraph */}
        <div className="text-[11px] text-slate-300 print:text-gray-800 leading-relaxed space-y-2">
          <p>
            <strong>Tactical Assessment:</strong> Tropical cyclone track models indicate landfall near{' '}
            {activeScenario.region} with sustained winds of <strong>{vmaxKt} kt</strong> ({Math.round(vmaxKt * 1.85)} km/h) and a peak tidal surge of <strong>{floodSimResult.maxFloodDepthM} meters</strong> above astronomical high tide.
          </p>
          <p>
            <strong>Cascading Vulnerability:</strong> Inundation of the coastal perimeter threatens{' '}
            <strong>{cascadeSimResult.cascadeSummary.failedSubstations} critical power substations</strong>, which will cut utility grid feeds to{' '}
            <strong>{cascadeSimResult.cascadeSummary.impairedHospitals} hospitals</strong> and{' '}
            <strong>{cascadeSimResult.cascadeSummary.impairedShelters} cyclone shelters</strong> serving ~{cascadeSimResult.cascadeSummary.totalPopulationAffected.toLocaleString('en-IN')} individuals unless auxiliary diesel generators are pre-deployed before T-12h.
          </p>
          <p>
            <strong>Financial Resilience:</strong> Sovereign parametric insurance triggers for wind and surge are{' '}
            <strong>{parametricState.overallStatus.toUpperCase()}</strong>, releasing an estimated{' '}
            <strong>₹{parametricState.estimatedPayoutCrores} Crore</strong> liquidity allocation to District Emergency Accounts at T-24h.
          </p>
        </div>
      </div>

      {/* Side-by-Side Intensity Comparison View */}
      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Intensity Sensitivity Analysis (Side-by-Side)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">±20 kt Forecast Uncertainty</span>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-1.5">Scenario</th>
                <th className="pb-1.5">Peak Surge</th>
                <th className="pb-1.5">Inundated Area</th>
                <th className="pb-1.5">Exposed Pop</th>
                <th className="pb-1.5">Failed Grid Nodes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className={idx === 1 ? 'text-cyan-300 font-semibold bg-cyan-950/20' : 'text-slate-300'}>
                  <td className="py-2">{row.scenario}</td>
                  <td className="py-2 tabular-nums">{row.surge} m</td>
                  <td className="py-2 tabular-nums">{row.area} km²</td>
                  <td className="py-2 tabular-nums">{row.pop.toLocaleString('en-IN')}</td>
                  <td className="py-2 tabular-nums">{row.failedSubs} substations</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Small Bar Chart Comparison */}
        <div className="h-36 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="scenario" stroke="#64748b" tick={{ fontSize: 9 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 9 }} unit="m" />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="surge" name="Peak Surge (m)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
