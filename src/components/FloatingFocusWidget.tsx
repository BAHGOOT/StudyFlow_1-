import React from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { Task, TreeSpecies, PomodoroMode } from '../types';
import { TreeIllustration } from './TreeIllustration';

interface FloatingFocusWidgetProps {
  task: Task;
  mode: PomodoroMode;
  secondsRemaining: number;
  formattedTime: string;
  progressPercent: number;
  isActive: boolean;
  selectedSpecies: TreeSpecies;
  onToggleActive: () => void;
  onExpand: () => void;
}

export const FloatingFocusWidget: React.FC<FloatingFocusWidgetProps> = ({
  task,
  mode,
  secondsRemaining,
  formattedTime,
  progressPercent,
  isActive,
  selectedSpecies,
  onToggleActive,
  onExpand,
}) => {
  const isTimerFinished = secondsRemaining === 0;

  return (
    <aside
      id="floating-focus-widget"
      className="fixed top-4 right-4 z-50 flex items-center gap-3 p-2.5 pr-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 select-none group hover:bg-slate-900 transition-all hover:ring-2 hover:ring-indigo-500/50"
    >
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={onExpand}
        title="Click to expand full focus view"
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
              isTimerFinished
                ? 'bg-emerald-400 animate-bounce ring-2 ring-emerald-500/50'
                : isActive
                ? mode === 'focus'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-400 animate-pulse'
                : 'bg-slate-400'
            }`}
          />
          <TreeIllustration progressPercent={progressPercent} species={selectedSpecies} size="sm" className="w-6 h-6" />
        </div>

        <div className="min-w-0 max-w-[140px] sm:max-w-[200px]">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-extrabold tracking-tight text-white">
              {formattedTime}
            </span>
            <span className="text-[10px] font-bold text-slate-300 uppercase">
              {mode === 'focus' ? 'Focus' : 'Break'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 truncate font-medium">
            {task.name}
          </p>
        </div>
      </div>

      {/* Quick controls */}
      <div className="flex items-center gap-1 pl-1 border-l border-slate-700/80">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive();
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title={isActive ? 'Pause' : 'Resume'}
        >
          {isActive ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
          )}
        </button>

        <button
          type="button"
          onClick={onExpand}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Expand Full Timer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
