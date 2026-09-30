import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';

const STAGES = [
  { t: -72, label: 'T-72h', name: 'Alert' },
  { t: -48, label: 'T-48h', name: 'Warning' },
  { t: -24, label: 'T-24h', name: 'Evacuate' },
  { t: -12, label: 'T-12h', name: 'Harden' },
  { t: -6, label: 'T-6h', name: 'Lockdown' },
  { t: 0, label: 'Landfall', name: 'T=0' },
  { t: 12, label: 'T+12h', name: 'Damage Triage' },
];

export const TimeScrubber: React.FC = () => {
  const { timeHours, setTimeHours, isPlaying, togglePlay } = useAppStore();
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation playback loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        const next = timeHours >= 12 ? -72 : timeHours + 3;
        setTimeHours(next);
      }, 1000);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, timeHours, setTimeHours]);

  return (
    <div className="h-16 border-t border-slate-800 bg-slate-950/95 px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Play / Pause / Reset Controls */}
      <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center transition-colors"
          title={isPlaying ? 'Pause timeline animation' : 'Play timeline animation'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button
          onClick={() => setTimeHours(-72)}
          className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          title="Reset to T-72h"
          aria-label="Reset timeline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Scrubber Track */}
      <div className="flex-1 px-6 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-sans">Timeline Progress:</span>
            <span className="font-bold text-amber-300 tabular-nums">
              {timeHours === 0 ? 'LANDFALL (00:00 IST)' : `T${timeHours > 0 ? '+' : ''}${timeHours} hours`}
            </span>
          </div>
          <span className="text-slate-400 text-[10px]">
            {timeHours <= 0 ? `${Math.abs(timeHours)}h to landfall` : `${timeHours}h post-landfall overland`}
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={-72}
          max={12}
          step={3}
          value={timeHours}
          onChange={(e) => setTimeHours(Number(e.target.value))}
          className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
        />

        {/* Major Stages Markers */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          {STAGES.map((stage) => {
            const isActive = timeHours === stage.t;
            return (
              <button
                key={stage.t}
                onClick={() => setTimeHours(stage.t)}
                className={`transition-colors flex flex-col items-center ${
                  isActive ? 'text-cyan-300 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <span>{stage.label}</span>
                <span className="text-[9px] text-slate-500 hidden sm:block">{stage.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
