import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Banknote, AlertOctagon, HelpCircle, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ParametricTab: React.FC = () => {
  const { parametricState, vmaxKt, floodSimResult, liveWeather, recomputeAll } = useAppStore();
  const [sumInsuredInput, setSumInsuredInput] = useState(parametricState.portfolioSumInsuredCrores.toString());

  const handleSumChange = (val: string) => {
    setSumInsuredInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      parametricState.portfolioSumInsuredCrores = num;
      recomputeAll();
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'triggered') return 'text-red-400 bg-red-950/60 border-red-500/40';
    if (status === 'watch') return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    return 'text-slate-400 bg-slate-900 border-slate-800';
  };

  return (
    <div className="p-4 space-y-4 text-xs font-sans overflow-y-auto">
      {/* Illustrative Simulation Financial Disclaimer */}
      <div className="p-2.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px] leading-relaxed">
        <span className="font-semibold text-blue-300">Illustrative Simulation Facility:</span> Financial values and payout triggers simulate sovereign disaster risk transfer liquidity (CCRIF/SEADRIF/NDRF sovereign models). Not commercial insurance advice.
      </div>

      {/* Pre-arranged Liquidity Release Card */}
      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-400" />
            Pre-Arranged Parametric Liquidity Release
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getStatusColor(parametricState.overallStatus)}`}>
            {parametricState.overallStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">Portfolio Sum Insured (₹ Cr)</div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-mono text-sm">₹</span>
              <input
                type="number"
                value={sumInsuredInput}
                onChange={(e) => handleSumChange(e.target.value)}
                className="w-full bg-transparent font-mono font-bold text-lg text-slate-100 focus:outline-none focus:border-b border-cyan-400"
              />
            </div>
            <div className="text-[9px] text-slate-500">Editable District Portfolio</div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">Estimated Payout Release</div>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              ₹{parametricState.estimatedPayoutCrores} Cr
            </div>
            <div className="text-[9px] text-slate-500 font-mono tabular-nums">
              {parametricState.payoutPercent}% of Sum Insured
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-cyan-300 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Recommended Liquidity Timing</div>
          <div>{parametricState.recommendedReleaseStage}</div>
        </div>
      </div>

      {/* Parametric Trigger Gauges */}
      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
            Index Trigger Calibration Gauges
          </span>
          <span className="text-[10px] text-slate-500 font-mono">3 Independent Indices</span>
        </div>

        <div className="space-y-2.5">
          {parametricState.triggers.map((trigger) => {
            const pct = Math.min(100, Math.round((trigger.currentValue / (trigger.threshold * 1.5)) * 100));
            const thresholdPct = Math.round((trigger.threshold / (trigger.threshold * 1.5)) * 100);

            return (
              <div key={trigger.id} className="p-2.5 rounded bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-slate-200">{trigger.name}</div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${getStatusColor(trigger.status)}`}>
                    {trigger.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
                  <span>
                    Current: <strong className="text-cyan-300">{trigger.currentValue} {trigger.unit}</strong>
                  </span>
                  <span className="text-slate-400">
                    Trigger Threshold: <strong>{trigger.threshold} {trigger.unit}</strong>
                  </span>
                </div>

                {/* Visual Gauge Bar */}
                <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      trigger.status === 'triggered'
                        ? 'bg-rose-500'
                        : trigger.status === 'watch'
                        ? 'bg-amber-400'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  {/* Threshold Pin marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                    style={{ left: `${thresholdPct}%` }}
                    title={`Threshold: ${trigger.threshold} ${trigger.unit}`}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Zero Payout</span>
                  <span>Trigger Point ({trigger.threshold} {trigger.unit})</span>
                  <span>100% Payout</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Basis Risk Note */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1 text-[11px] text-slate-400 leading-relaxed">
        <div className="font-semibold text-slate-300 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Basis Risk Architecture Note</span>
        </div>
        <p>{parametricState.basisRiskNote}</p>
      </div>
    </div>
  );
};
