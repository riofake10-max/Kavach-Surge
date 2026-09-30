import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Globe, Download, Upload, Check, RefreshCw, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { InteropModelParams } from '../../types';

const REGISTRY_MODELS: InteropModelParams[] = [
  {
    id: 'odisha_v3_osdma',
    name: 'OSDMA Shallow Littoral Calibrated v3.2',
    region: 'Odisha Coastal Shelf',
    version: 'v3.2-2026',
    shelfSlopeFactor: 1.15,
    windSetupMultiplier: 2.2,
    pressureDecayCoeff: 0.01,
    inlandDecayRatePerKm: 0.22,
    validationScore: 94.2,
    notes: 'Calibrated against INCOIS tide gauges during Cyclone Fani & Phailin.',
  },
  {
    id: 'bengal_sundarbans_v4',
    name: 'Bengal Deltaic Mangrove Roughness v4.0',
    region: 'West Bengal & Sundarbans',
    version: 'v4.0-2026',
    shelfSlopeFactor: 1.45,
    windSetupMultiplier: 2.65,
    pressureDecayCoeff: 0.012,
    inlandDecayRatePerKm: 0.18,
    validationScore: 91.8,
    notes: 'Incorporates extreme shallow bathymetry and mangrove damping attenuation.',
  },
  {
    id: 'andhra_coromandel_v2',
    name: 'Andhra-Coromandel Steep Slope Model v2.8',
    region: 'Andhra Pradesh & Northern Tamil Nadu',
    version: 'v2.8-2025',
    shelfSlopeFactor: 0.95,
    windSetupMultiplier: 1.95,
    pressureDecayCoeff: 0.009,
    inlandDecayRatePerKm: 0.26,
    validationScore: 93.5,
    notes: 'Optimized for narrow continental shelf margins with rapid wave dissipation.',
  },
  {
    id: 'bangladesh_cpp_v5',
    name: 'Cyclone Preparedness Programme (CPP) Coastal v5.1',
    region: 'Meghna Estuary / Bay of Bengal North',
    version: 'v5.1-2026',
    shelfSlopeFactor: 1.55,
    windSetupMultiplier: 2.8,
    pressureDecayCoeff: 0.013,
    inlandDecayRatePerKm: 0.16,
    validationScore: 95.1,
    notes: 'Inter-governmental regional collaboration node with BMD / CPP.',
  },
];

const APAC_NODES = [
  { name: 'Odisha (OSDMA)', status: 'Active Node', ping: '12ms' },
  { name: 'West Bengal (WBDMA)', status: 'Active Node', ping: '18ms' },
  { name: 'Andhra Pradesh (APSDMA)', status: 'Active Node', ping: '22ms' },
  { name: 'Tamil Nadu (TNSDMA)', status: 'Active Node', ping: '25ms' },
  { name: 'Bangladesh (BMD/CPP)', status: 'Federated Node', ping: '38ms' },
  { name: 'Sri Lanka (DMC)', status: 'Federated Node', ping: '42ms' },
];

export const InteroperabilityTab: React.FC = () => {
  const { applyInteropParams, activeScenario, assumptions, floodSimResult } = useAppStore();
  const [selectedModel, setSelectedModel] = useState<InteropModelParams>(REGISTRY_MODELS[0]);
  const [importedMessage, setImportedMessage] = useState<string | null>(null);

  const handleApply = (model: InteropModelParams) => {
    setSelectedModel(model);
    applyInteropParams(model);
    setImportedMessage(`Applied ${model.name}. Model recalibrated.`);
    setTimeout(() => setImportedMessage(null), 3000);
  };

  const exportScenarioJson = () => {
    const payload = {
      scenario: activeScenario,
      assumptions,
      exportedAt: new Date().toISOString(),
      standards: 'KAVACH-OpenHazard-v1.0 (Digital Public Good)',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KAVACH_${activeScenario.id}_model_params.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4 text-xs font-sans overflow-y-auto">
      {/* Digital Public Good Notice */}
      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-[11px] leading-relaxed space-y-1">
        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Digital Public Good Architecture</span>
        </div>
        <p>
          Open-source algorithms, standard GeoJSON & CAP schemas, zero proprietary lock-in. Enables cross-border peer modeling across Bay of Bengal littoral authorities without sharing sensitive population registries.
        </p>
      </div>

      {/* APAC Node Federation Grid */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
          <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Federated APAC Authority Mesh
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">6 Nodes Synchronized</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {APAC_NODES.map((node, i) => (
            <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
              <div>
                <div className="font-medium text-slate-200">{node.name}</div>
                <div className="text-[9px] text-slate-500 font-mono">{node.status}</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Model Registry Calibration Table */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
            Coastal Bathymetry Model Registry
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Calibrated Coefficients</span>
        </div>

        {importedMessage && (
          <div className="p-2 rounded bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {importedMessage}
          </div>
        )}

        <div className="space-y-2">
          {REGISTRY_MODELS.map((m) => {
            const isSelected = selectedModel.id === m.id;
            return (
              <div
                key={m.id}
                className={`p-2.5 rounded border transition-colors ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500/60'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.region} · {m.version}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      Score: {m.validationScore}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 p-1.5 rounded">
                  <div>Shelf Slope: <strong className="text-slate-200">{m.shelfSlopeFactor}</strong></div>
                  <div>Wind Mult: <strong className="text-slate-200">{m.windSetupMultiplier}</strong></div>
                  <div>Decay: <strong className="text-slate-200">{m.inlandDecayRatePerKm} m/km</strong></div>
                </div>

                <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">{m.notes}</p>

                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleApply(m)}
                    className="px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Import Parameters</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export / Import Open Standard JSON */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">
          Open Standard Model Interoperability
        </span>
        <p className="text-[11px] text-slate-400">
          Export full active scenario parameters, calibration coefficients, and elevation metadata as open JSON:
        </p>
        <button
          onClick={exportScenarioJson}
          className="w-full py-2 rounded bg-slate-950 border border-slate-800 hover:bg-slate-850 text-cyan-300 font-mono font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export Scenario & Model JSON
        </button>
      </div>
    </div>
  );
};
