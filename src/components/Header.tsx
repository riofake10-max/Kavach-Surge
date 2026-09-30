import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Shield, Play, Sliders, Database, Camera, Activity, Volume2, Globe } from 'lucide-react';
import { LANGUAGE_NAMES } from '../ai/advisories';
import { hasGeminiApiKey } from '../config/gemini';

export const Header: React.FC = () => {
  const {
    activeScenario,
    timeHours,
    language,
    setLanguage,
    startDemo,
    isDemoRunning,
    setIsAssumptionsOpen,
    setIsDataSourcesOpen,
    setIsMultimodalOpen,
    readinessPct,
    dataSources,
  } = useAppStore();

  const apiKeyConfigured = hasGeminiApiKey();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand & Stage Zone */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-100 font-sans">
                KAVACH<span className="text-cyan-400">-Surge</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium rounded border border-cyan-500/30 bg-cyan-950/50 text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                SIMULATION
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Bay of Bengal Pre-Landfall Decision Engine · {activeScenario.region}
            </p>
          </div>
        </div>

        {/* Lead time badge */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs font-mono">
          <span className="text-slate-400">STAGE:</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-semibold tabular-nums">
            {timeHours === 0 ? 'LANDFALL (T=0)' : `T${timeHours > 0 ? '+' : ''}${timeHours}h`}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">READINESS:</span>
          <span className="text-emerald-400 font-semibold tabular-nums">{readinessPct}%</span>
        </div>
      </div>

      {/* Control Actions Zone */}
      <div className="flex items-center gap-2">
        {/* API Key Status Notice if in Demo Mode */}
        {!apiKeyConfigured && (
          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded border border-amber-500/30 bg-amber-950/30 text-amber-300" title="Running with bundled domain intelligence. Inject GEMINI_API_KEY in AI Studio secrets for live model calls.">
            <Activity className="w-3 h-3 text-amber-400" />
            <span>DEMO AI MODE (OFFLINE SAMPLES)</span>
          </div>
        )}

        {/* Guided Demo Walkthrough */}
        <button
          onClick={startDemo}
          disabled={isDemoRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
          title="Run 60-second guided simulation walkthrough"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Play Demo</span>
        </button>

        {/* Vision AI Trigger */}
        <button
          onClick={() => setIsMultimodalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
          title="Upload or inspect drone / satellite photo for AI vulnerability assessment"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Imagery AI</span>
        </button>

        {/* Model Assumptions Drawer */}
        <button
          onClick={() => setIsAssumptionsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Inspect and edit screening model formulas and decay parameters"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Assumptions</span>
        </button>

        {/* Real Data Ingestion Status */}
        <button
          onClick={() => setIsDataSourcesOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          title="View status of Open-Meteo, Marine, Elevation, and OSM feeds"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Feeds</span>
        </button>

        {/* Language Selector */}
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs font-medium rounded border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-850 focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
            aria-label="Select Advisory Language"
          >
            {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
              <option key={code} value={code} className="bg-slate-900 text-slate-200">
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
