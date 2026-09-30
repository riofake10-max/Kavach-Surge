import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, ShieldCheck, Flame } from 'lucide-react';
import { ActionPlanItem } from '../../types';

export const ActionPlanTab: React.FC = () => {
  const { actionPlan, readinessPct, updateActionStatus, timeHours } = useAppStore();

  const evacuateActions = actionPlan.filter((a) => a.category === 'EVACUATE');
  const hardenActions = actionPlan.filter((a) => a.category === 'HARDEN');
  const prepositionActions = actionPlan.filter((a) => a.category === 'PRE-POSITION');

  const renderActionCard = (item: ActionPlanItem) => {
    let priorityBadge = 'bg-rose-950 text-rose-300 border-rose-500/40';
    if (item.priority === 'HIGH') priorityBadge = 'bg-amber-950 text-amber-300 border-amber-500/40';
    if (item.priority === 'MEDIUM') priorityBadge = 'bg-blue-950 text-blue-300 border-blue-500/40';

    return (
      <div
        key={item.id}
        className={`p-3 rounded-lg border transition-all ${
          item.status === 'done'
            ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
            : item.status === 'in_progress'
            ? 'bg-slate-900 border-cyan-500/40 shadow-sm'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${priorityBadge}`}>
                {item.priority}
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> Deadline: {item.deadlineRelT}
              </span>
            </div>
            <h4 className={`text-xs font-semibold ${item.status === 'done' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
              {item.title}
            </h4>
          </div>

          {/* Status selector */}
          <select
            value={item.status}
            onChange={(e) => updateActionStatus(item.id, e.target.value as any)}
            className="text-[10px] font-mono font-medium py-1 px-2 rounded bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
          </select>
        </div>

        <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{item.description}</p>

        {/* Explainability Requirement: Model Output Citation */}
        <div className="mt-2.5 p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-cyan-300/90 leading-tight flex items-start gap-1.5">
          <span className="font-bold uppercase text-slate-400 shrink-0">Model Rationale:</span>
          <span>{item.modelRationale}</span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-medium text-slate-400">Authority: {item.authority}</span>
          <span className="font-mono text-slate-400">Target: {item.targetAssetOrZone}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 text-xs font-sans overflow-y-auto">
      {/* Readiness Gauge Header */}
      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-200 font-semibold">
              District Operational Readiness
            </span>
          </div>
          <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">{readinessPct}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${readinessPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
          <span>Active Phase: T{timeHours >= 0 ? '+' : ''}{timeHours}h</span>
          <span>{actionPlan.filter((a) => a.status === 'done').length} of {actionPlan.length} Actions Completed</span>
        </div>
      </div>

      {/* EVACUATE CATEGORY */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-wider">
          <span>01. EVACUATION DIRECTIVES</span>
          <span className="text-[10px] text-slate-500">({evacuateActions.length})</span>
        </div>
        {evacuateActions.map(renderActionCard)}
      </div>

      {/* HARDEN CATEGORY */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider">
          <span>02. INFRASTRUCTURE HARDENING</span>
          <span className="text-[10px] text-slate-500">({hardenActions.length})</span>
        </div>
        {hardenActions.map(renderActionCard)}
      </div>

      {/* PRE-POSITION CATEGORY */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
          <span>03. PRE-POSITIONING (NDRF / STAGING)</span>
          <span className="text-[10px] text-slate-500">({prepositionActions.length})</span>
        </div>
        {prepositionActions.map(renderActionCard)}
      </div>
    </div>
  );
};
