import React, { useState } from 'react';
import { Task, Course } from '../types';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { formatDuration, formatDeadlineRelative } from '../utils/smartPlanner';

interface SkipTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  course: Course | null;
  onClose: () => void;
  onConfirmSkipAndReschedule: (
    taskId: string,
    rescheduleOption: 'tomorrow' | 'friday' | 'weekend' | 'next_week'
  ) => void;
}

export function SkipTaskModal({
  isOpen,
  task,
  course,
  onClose,
  onConfirmSkipAndReschedule,
}: SkipTaskModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'tomorrow' | 'friday' | 'weekend' | 'next_week'
  >('tomorrow');

  if (!isOpen || !task) return null;

  const handleConfirm = () => {
    onConfirmSkipAndReschedule(task.id, selectedOption);
    onClose();
  };

  return (
    <div
      id="skip-task-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="skip-task-modal-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-2 text-amber-900">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                Skip for Now & Reschedule
              </h3>
              <p className="text-[11px] text-slate-500">Second verification required</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: course?.accentHex || '#4f46e5' }}
              >
                {course?.name || 'Course'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {task.type}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{task.name}</h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Due: {formatDeadlineRelative(task.deadline).text}</span>
              <span>•</span>
              <span>Est: {formatDuration(task.estimatedMinutes)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select when to reschedule this task:
            </label>

            <div className="space-y-2">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedOption === 'tomorrow'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="reschedule"
                    checked={selectedOption === 'tomorrow'}
                    onChange={() => setSelectedOption('tomorrow')}
                    className="accent-indigo-600"
                  />
                  <span>Reschedule for Tomorrow (Wednesday)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  Recommended
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedOption === 'friday'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="reschedule"
                    checked={selectedOption === 'friday'}
                    onChange={() => setSelectedOption('friday')}
                    className="accent-indigo-600"
                  />
                  <span>Reschedule for Friday (Before Weekend)</span>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedOption === 'weekend'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="reschedule"
                    checked={selectedOption === 'weekend'}
                    onChange={() => setSelectedOption('weekend')}
                    className="accent-indigo-600"
                  />
                  <span>Reschedule for the Weekend (Saturday)</span>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedOption === 'next_week'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="reschedule"
                    checked={selectedOption === 'next_week'}
                    onChange={() => setSelectedOption('next_week')}
                    className="accent-indigo-600"
                  />
                  <span>Reschedule for Next Week</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel (Keep in Plan)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Confirm & Reschedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}
