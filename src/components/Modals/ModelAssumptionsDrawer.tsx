import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, RotateCcw, Sliders, Check, HelpCircle } from 'lucide-react';
import { DEFAULT_SURGE_ASSUMPTIONS, SurgeModelAssumptions } from '../../engine/surge';

export const ModelAssumptionsDrawer: React.FC = () => {
  const { isAssumptionsOpen, setIsAssumptionsOpen, assumptions, updateAssumptions } = useAppStore();
  const [form, setForm] = useState<SurgeModelAssumptions>({ ...assumptions });

  if (!isAssumptionsOpen) return null;

  const handleSave = () => {
    updateAssumptions(form);
    setIsAssumptionsOpen(false);
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_SURGE_ASSUMPTIONS });
    updateAssumptions(DEFAULT_SURGE_ASSUMPTIONS);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-[480px] h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col text-xs font-sans animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">Model Assumptions & Formulation</h3>
              <p className="text-[10px] text-slate-400 font-mono">Screening-Grade Hydrodynamic Calibration Parameters</p>
            </div>
          </div>
          <button
            onClick={() => setIsAssumptionsOpen(false)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1 text-slate-300 leading-relaxed text-[11px]">
            <p className="font-semibold text-cyan-300">Screening Model Formulation:</p>
            <p className="font-mono text-[10px] text-slate-400">
              Surge_coast = 0.01 × (P_ambient - P_c) + Multiplier × (V_max / 100)² × ShelfSlope + Tide + 0.18 × WaveHeight
            </p>
            <p className="text-[10px] text-slate-400">
              Decay inland = BaseDecay × Distance_km × (1 + (Roughness - 0.03) × 5). Floods only if hydrologically connected to sea cells.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 font-mono">
            {/* Ambient Pressure */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-slate-300 text-[11px]">
                <span>Ambient Pressure (hPa)</span>
                <span className="text-cyan-300">{form.ambientPressureHpa} hPa</span>
              </label>
              <input
                type="number"
                value={form.ambientPressureHpa}
                onChange={(e) => setForm({ ...form, ambientPressureHpa: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
              <p className="text-[10px] text-slate-500 font-sans">Standard tropical ambient atmospheric pressure at periphery.</p>
            </div>

            {/* Inverse Barometer Factor */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-slate-300 text-[11px]">
                <span>Inverse Barometer Factor (m/hPa)</span>
                <span className="text-cyan-300">{form.inverseBarometerFactor} m/hPa</span>
              </label>
              <input
                type="number"
                step="0.001"
                value={form.inverseBarometerFactor}
                onChange={(e) => setForm({ ...form, inverseBarometerFactor: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
              <p className="text-[10px] text-slate-500 font-sans">Sea level rises ~0.01m per 1 hPa pressure drop.</p>
            </div>

            {/* Wind Setup Multiplier */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-slate-300 text-[11px]">
                <span>Wind Setup Base Multiplier</span>
                <span className="text-cyan-300">{form.windSetupBaseMultiplier}</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={form.windSetupBaseMultiplier}
                onChange={(e) => setForm({ ...form, windSetupBaseMultiplier: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
              <p className="text-[10px] text-slate-500 font-sans">Empirical coefficient scaling surface wind shear stress stress with Vmax².</p>
            </div>

            {/* Surf Zone Wave Setup Ratio */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-slate-300 text-[11px]">
                <span>Wave Setup Ratio</span>
                <span className="text-cyan-300">{form.waveSetupRatio}</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.waveSetupRatio}
                onChange={(e) => setForm({ ...form, waveSetupRatio: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
              <p className="text-[10px] text-slate-500 font-sans">Radiation stress contribution from breaking waves (typically 15%–20% of Hs).</p>
            </div>

            {/* Base Inland Decay */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-slate-300 text-[11px]">
                <span>Base Inland Decay Rate (m/km)</span>
                <span className="text-cyan-300">{form.baseInlandDecayMPerKm} m/km</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.baseInlandDecayMPerKm}
                onChange={(e) => setForm({ ...form, baseInlandDecayMPerKm: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
              <p className="text-[10px] text-slate-500 font-sans">Attenuation rate of surge wave propagation over coastal landforms.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-950">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" /> Apply & Recompute
          </button>
        </div>
      </div>
    </div>
  );
};
