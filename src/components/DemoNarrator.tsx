import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Play, Pause, SkipForward, X, ShieldAlert } from 'lucide-react';

interface DemoScriptStep {
  timeHours: number;
  activeTab: 'surge_risk' | 'cascades' | 'planner' | 'parametric' | 'analyst' | 'advisories' | 'interop' | 'brief';
  durationMs: number;
  caption: string;
}

const DEMO_STEPS: DemoScriptStep[] = [
  {
    timeHours: -72,
    activeTab: 'surge_risk',
    durationMs: 7000,
    caption: '1/6: [T-72h Alert] Cyclone Fani detected in Bay of Bengal. Initial track polyline and widening cone of uncertainty established towards Odisha coast.',
  },
  {
    timeHours: -48,
    activeTab: 'surge_risk',
    durationMs: 8000,
    caption: '2/6: [T-48h Warning] Storm intensifies to 115 kt. Holland profile models 34/50/64kt wind radii expand. Modeled surge grows to 4.5m with shallow shelf amplification.',
  },
  {
    timeHours: -24,
    activeTab: 'cascades',
    durationMs: 8500,
    caption: '3/6: [T-24h Evacuation & Cascade] Inundation breaches 0.5m threshold at Brahmagiri Substation, tripping grid power cascades to hospitals and shelters.',
  },
  {
    timeHours: -12,
    activeTab: 'parametric',
    durationMs: 8000,
    caption: '4/6: [T-12h Parametric Liquidity] Sustained wind (115 kt) and surge (>1.5m) triggers fire. ₹250 Cr pre-arranged sovereign liquidity release authorized for District Collectors.',
  },
  {
    timeHours: -6,
    activeTab: 'advisories',
    durationMs: 9000,
    caption: '5/6: [T-6h Multilingual Warning] Duty Officer reviews and approves Odia and English early warnings. Broadcast dispatched to 48,000 fishermen via simulated SMS and IVR siren.',
  },
  {
    timeHours: 0,
    activeTab: 'brief',
    durationMs: 9000,
    caption: '6/6: [Landfall T=0] Executive SitRep generated with 65% readiness and complete accountability trail. Pre-landfall decisions secured ~1.2M exposed citizens.',
  },
];

export const DemoNarrator: React.FC = () => {
  const { isDemoRunning, demoStepIndex, nextDemoStep, stopDemo, setTimeHours, setActiveTab, setScenario } = useAppStore();

  useEffect(() => {
    if (!isDemoRunning) return;

    if (demoStepIndex >= DEMO_STEPS.length) {
      stopDemo();
      return;
    }

    const currentStep = DEMO_STEPS[demoStepIndex];
    setTimeHours(currentStep.timeHours);
    setActiveTab(currentStep.activeTab);

    const timer = setTimeout(() => {
      nextDemoStep();
    }, currentStep.durationMs);

    return () => clearTimeout(timer);
  }, [isDemoRunning, demoStepIndex, nextDemoStep, stopDemo, setTimeHours, setActiveTab]);

  if (!isDemoRunning || demoStepIndex >= DEMO_STEPS.length) return null;

  const step = DEMO_STEPS[demoStepIndex];

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-950/95 backdrop-blur border border-cyan-500/60 rounded-xl p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
            KAVACH-SURGE GUIDED WALKTHROUGH
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={nextDemoStep}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center gap-1 transition-colors"
          >
            <span>Skip Step</span>
            <SkipForward className="w-3 h-3" />
          </button>
          <button
            onClick={stopDemo}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Exit Guided Demo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-slate-100 font-sans leading-relaxed">
        {step.caption}
      </p>

      {/* Step Progress Line */}
      <div className="mt-3 flex gap-1">
        {DEMO_STEPS.map((s, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx === demoStepIndex
                ? 'bg-cyan-400'
                : idx < demoStepIndex
                ? 'bg-cyan-700'
                : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
