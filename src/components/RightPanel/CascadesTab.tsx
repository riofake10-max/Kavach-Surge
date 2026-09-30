import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Zap, ShieldAlert, HeartPulse, Shield, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CriticalAsset } from '../../types';

export const CascadesTab: React.FC = () => {
  const { cascadeSimResult, toggleBackupPower, selectAsset } = useAppStore();
  const { cascadeSummary, assets, nodeImpacts } = cascadeSimResult;

  const failedSubstations = assets.filter((a) => a.type === 'substation' && a.status === 'failed');
  const hospitals = assets.filter((a) => a.type === 'hospital');
  const shelters = assets.filter((a) => a.type === 'shelter');

  return (
    <div className="p-4 space-y-4 text-xs font-sans overflow-y-auto">
      {/* Cascade Report Card */}
      <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 space-y-2">
        <div className="flex items-center gap-2 text-red-400 font-mono text-[11px] font-bold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Systemic Cascade Failure Report</span>
        </div>
        <p className="text-sm font-semibold text-slate-100 leading-snug">
          {cascadeSummary.headline}
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
          <div className="p-1.5 rounded bg-slate-950/60 border border-red-500/30">
            <div className="text-[10px] text-red-400">Failed Subs</div>
            <div className="text-base font-bold text-slate-100 tabular-nums">{cascadeSummary.failedSubstations}</div>
          </div>
          <div className="p-1.5 rounded bg-slate-950/60 border border-red-500/30">
            <div className="text-[10px] text-red-400">Impaired Med</div>
            <div className="text-base font-bold text-slate-100 tabular-nums">{cascadeSummary.impairedHospitals}</div>
          </div>
          <div className="p-1.5 rounded bg-slate-950/60 border border-red-500/30">
            <div className="text-[10px] text-red-400">Cut Arterials</div>
            <div className="text-base font-bold text-slate-100 tabular-nums">{cascadeSummary.cutRoads}</div>
          </div>
        </div>
      </div>

      {/* Interactive Mitigation Mechanism: Backup Generator Hardening */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Interactive Resilience Toggles
          </span>
          <span className="text-[10px] text-slate-500">Live Cascade Mitigation</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Toggle emergency auxiliary genset power to mitigate blackout cascades without waiting for grid restoration:
        </p>

        <div className="space-y-2 pt-1">
          {hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  <span>{hosp.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Flood: {hosp.floodDepthM}m · Wind: {hosp.windExposureKt} kt · Vuln: {hosp.vulnerabilityIndex}/100
                </div>
              </div>

              <button
                onClick={() => toggleBackupPower(hosp.id, !hosp.hasBackupPower)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors flex items-center gap-1 ${
                  hosp.hasBackupPower
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                }`}
              >
                {hosp.hasBackupPower ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Genset ON
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-red-400" /> Deploy Genset
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Infrastructure Vulnerability Rankings */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
            Infrastructure Vulnerability Index
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Ranked by Systemic Score</span>
        </div>

        <div className="space-y-1.5">
          {assets
            .slice()
            .sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex)
            .map((asset) => (
              <div
                key={asset.id}
                onClick={() => selectAsset(asset)}
                className="p-2 rounded bg-slate-950/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-200 flex items-center gap-1.5">
                    <span className="text-xs">
                      {asset.type === 'substation' ? '⚡' : asset.type === 'hospital' ? '🏥' : asset.type === 'shelter' ? '🛡️' : '🌉'}
                    </span>
                    <span>{asset.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Status: <span className="uppercase">{asset.status}</span> · Flood: {asset.floodDepthM}m
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-rose-400 tabular-nums">
                      {asset.vulnerabilityIndex}/100
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">VULN INDEX</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
