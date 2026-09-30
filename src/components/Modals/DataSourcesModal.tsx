import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Database, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export const DataSourcesModal: React.FC = () => {
  const { isDataSourcesOpen, setIsDataSourcesOpen, dataSources, activeScenario, setScenario, scenarioId } = useAppStore();

  if (!isDataSourcesOpen) return null;

  const getStatusBadge = (status: string) => {
    if (status === 'live') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> LIVE CONNECTED
        </span>
      );
    }
    if (status === 'cached') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-500/40">
          <Clock className="w-3 h-3 text-blue-400" /> LOCAL CACHE (HIT)
        </span>
      );
    }
    if (status === 'loading') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
          <RefreshCw className="w-3 h-3 animate-spin" /> FETCHING
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40">
        <AlertTriangle className="w-3 h-3 text-amber-400" /> RESILIENT FALLBACK
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex flex-col text-xs font-sans overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Live External Data Ingestion Architecture</h3>
              <p className="text-[10px] text-slate-400 font-mono">Keyless, Free, CORS-Enabled Adapters with Dual-Tier Cache & Fallbacks</p>
            </div>
          </div>
          <button
            onClick={() => setIsDataSourcesOpen(false)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh]">
          {Object.entries(dataSources).map(([key, src]) => (
            <div key={key} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 font-mono text-[11px]">{src.name}</span>
                {getStatusBadge(src.status)}
              </div>
              {src.details && <p className="text-[11px] text-slate-300 font-mono">{src.details}</p>}
              {src.lastUpdated && (
                <div className="text-[10px] text-slate-500 font-mono">Last Synchronized: {src.lastUpdated}</div>
              )}
            </div>
          ))}

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1 leading-relaxed">
            <span className="font-semibold text-slate-300">Offline Resilience Guarantee:</span>
            <p>
              In disaster scenarios where network links fail, all 5 ingestion feeds seamlessly transition to in-memory/sessionStorage cache and bundled calibration datasets, ensuring the Incident Command system never hangs or crashes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={() => setScenario(scenarioId)}
            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-query Live Endpoints
          </button>
        </div>
      </div>
    </div>
  );
};
