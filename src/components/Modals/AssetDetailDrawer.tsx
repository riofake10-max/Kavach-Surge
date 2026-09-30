import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Zap, Wind, Waves, ShieldAlert, CheckCircle2, Camera, ArrowRight, Info } from 'lucide-react';

export const AssetDetailDrawer: React.FC = () => {
  const { selectedAsset, selectAsset, toggleBackupPower, setIsMultimodalOpen } = useAppStore();

  if (!selectedAsset) return null;

  const {
    id,
    name,
    type,
    zone,
    elevationM,
    windExposureKt,
    floodDepthM,
    status,
    hasBackupPower,
    vulnerabilityIndex,
    vulnerabilityBreakdown,
    aiAssessedScore,
    aiAssessmentNotes,
  } = selectedAsset;

  const getStatusBadge = () => {
    if (status === 'failed') return 'bg-red-950 text-red-300 border-red-500/40';
    if (status === 'impacted') return 'bg-orange-950 text-orange-300 border-orange-500/40';
    if (status === 'at_risk') return 'bg-amber-950 text-amber-300 border-amber-500/40';
    return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-950/98 backdrop-blur border-l border-slate-800 shadow-2xl z-50 flex flex-col text-xs font-sans select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between">
        <div className="space-y-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-900 border border-slate-800 text-cyan-300">
              {type}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${getStatusBadge()}`}>
              {status}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 leading-snug">{name}</h3>
          <p className="text-[11px] text-slate-400 font-mono">{zone}</p>
        </div>
        <button
          onClick={() => selectAsset(null)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close Asset Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Core Modeled Exposure KPIs */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Waves className="w-3 h-3 text-cyan-400" /> Modeled Flood Depth
            </div>
            <div className="text-lg font-bold text-cyan-300 tabular-nums mt-0.5">{floodDepthM} m</div>
            <div className="text-[9px] text-slate-500">Elevation: {elevationM}m MSL</div>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-amber-400" /> Wind Exposure
            </div>
            <div className="text-lg font-bold text-amber-300 tabular-nums mt-0.5">{windExposureKt} kt</div>
            <div className="text-[9px] text-slate-500">{Math.round(windExposureKt * 1.85)} km/h sustained</div>
          </div>
        </div>

        {/* Emergency Power Resilience Toggle */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Auxiliary Power Status
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${hasBackupPower ? 'text-emerald-400 bg-emerald-950' : 'text-red-400 bg-red-950'}`}>
              {hasBackupPower ? 'GENSET OPERATIONAL' : 'NO BACKUP'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {hasBackupPower
              ? 'Emergency on-site diesel generator is connected and active. Mitigates upstream grid substation outages.'
              : 'Facility is 100% dependent on upstream utility distribution. Susceptible to cascading power loss.'}
          </p>
          <button
            onClick={() => toggleBackupPower(id, !hasBackupPower)}
            className={`w-full py-1.5 rounded font-mono font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 ${
              hasBackupPower
                ? 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-850'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {hasBackupPower ? 'Disconnect Emergency Genset' : 'Deploy Emergency Genset (500 kVA)'}
          </button>
        </div>

        {/* Vulnerability Index & Explain This Score Section */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Vulnerability Index (0 - 100)
            </span>
            <span className="text-lg font-mono font-bold text-rose-400 tabular-nums">
              {vulnerabilityIndex}/100
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full"
              style={{ width: `${vulnerabilityIndex}%` }}
            />
          </div>

          {/* Explain This Score: Exact weighted contributions */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Explain This Score (Weighted Contributions)</span>
            </div>

            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between p-1.5 rounded bg-slate-950 text-slate-300">
                <span>Hazard Exposure (Weight: 40%)</span>
                <span className="font-bold text-cyan-300">{vulnerabilityBreakdown.hazardScore} pts</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950 text-slate-300">
                <span>Power & Upstream Dependency (Weight: 35%)</span>
                <span className="font-bold text-cyan-300">{vulnerabilityBreakdown.dependencyScore} pts</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950 text-slate-300">
                <span>Access Loss / Road Cut (Weight: 25%)</span>
                <span className="font-bold text-cyan-300">{vulnerabilityBreakdown.accessScore} pts</span>
              </div>
            </div>
          </div>

          {/* AI Vision Assessed Score if present */}
          {aiAssessedScore !== undefined && (
            <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-300">
                <span>AI Vision Assessment (Multimodal)</span>
                <span>{aiAssessedScore}/100</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">{aiAssessmentNotes}</p>
            </div>
          )}
        </div>

        {/* Multimodal Drone/Satellite Inspection Action */}
        <button
          onClick={() => setIsMultimodalOpen(true, selectedAsset)}
          className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Camera className="w-4 h-4" />
          <span>Assess Structural Imagery with Gemini AI</span>
        </button>
      </div>
    </div>
  );
};
