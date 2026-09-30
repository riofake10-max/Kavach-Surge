import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Waves,
  Zap,
  CheckSquare,
  Banknote,
  Bot,
  Bell,
  Globe,
  FileText,
} from 'lucide-react';
import { SurgeRiskTab } from './SurgeRiskTab';
import { CascadesTab } from './CascadesTab';
import { ActionPlanTab } from './ActionPlanTab';
import { ParametricTab } from './ParametricTab';
import { AiAnalystTab } from './AiAnalystTab';
import { AdvisoriesTab } from './AdvisoriesTab';
import { InteroperabilityTab } from './InteroperabilityTab';
import { ExecutiveBriefTab } from './ExecutiveBriefTab';

const TABS = [
  { id: 'surge_risk', label: 'Surge & Risk', icon: Waves },
  { id: 'cascades', label: 'Cascades', icon: Zap },
  { id: 'planner', label: 'Action Plan', icon: CheckSquare },
  { id: 'parametric', label: 'Parametric', icon: Banknote },
  { id: 'analyst', label: 'AI Analyst', icon: Bot },
  { id: 'advisories', label: 'Advisories', icon: Bell },
  { id: 'interop', label: 'Interoperability', icon: Globe },
  { id: 'brief', label: 'Executive Brief', icon: FileText },
] as const;

export const RightPanel: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="w-[450px] border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Tab Navigation Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 px-2 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'surge_risk' && <SurgeRiskTab />}
        {activeTab === 'cascades' && <CascadesTab />}
        {activeTab === 'planner' && <ActionPlanTab />}
        {activeTab === 'parametric' && <ParametricTab />}
        {activeTab === 'analyst' && <AiAnalystTab />}
        {activeTab === 'advisories' && <AdvisoriesTab />}
        {activeTab === 'interop' && <InteroperabilityTab />}
        {activeTab === 'brief' && <ExecutiveBriefTab />}
      </div>
    </div>
  );
};
