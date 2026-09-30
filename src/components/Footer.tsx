import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { activeScenario } = useAppStore();

  return (
    <footer className="h-7 border-t border-slate-800 bg-slate-950 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 select-none z-20">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-slate-300">
          Decision support only. Follow official <strong>IMD / INCOIS / SDMA</strong> advisories.
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-slate-400">
        <span className="italic font-sans text-cyan-300/80">
          "Don't forecast the storm. Forecast the decisions."
        </span>
        <span>·</span>
        <span>{activeScenario.region}</span>
      </div>
    </footer>
  );
};
