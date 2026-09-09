import React from 'react';
import { Task, Course } from '../types';
import {
  X,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  FileCheck2,
  Info,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { formatDuration, formatDeadlineRelative } from '../utils/smartPlanner';

interface AssessmentCheckModalProps {
  isOpen: boolean;
  task: Task | null;
  course: Course | null;
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
}

export function AssessmentCheckModal({
  isOpen,
  task,
  course,
  onClose,
  onCompleteTask,
}: AssessmentCheckModalProps) {
  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'completed';
  const earnedCoins = Math.max(1, Math.round(((task.estimatedMinutes || 60) / 60) * 5));

  const handleConfirmCompletion = () => {
    onCompleteTask(task.id);
    onClose();
  };

  return (
    <div
      id="assessment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="assessment-check-card"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Award className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                {task.type === 'Exam' ? 'Exam Assessment' : task.type === 'Quiz' ? 'Quiz Evaluation' : 'Academic Milestone Check'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Untimed assessment • No Pomodoro timer required
              </p>
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
        <div className="p-6 space-y-5">
          {/* Course & Type tag */}
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-2xs"
              style={{ backgroundColor: course?.accentHex || '#4f46e5' }}
            >
              {course?.name || 'Course'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {task.type}
            </span>
            {isCompleted && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              {task.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Due: {formatDeadlineRelative(task.deadline).text}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Duration: {formatDuration(task.estimatedMinutes)}</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <span>🪙 +{earnedCoins} Coins</span>
              </span>
            </div>
          </div>

          {/* Description of what the student has for this task */}
          {task.notes ? (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>What you have for this task (Description & Syllabus Notes):</span>
              </div>
              <p className="text-indigo-950/80 leading-relaxed whitespace-pre-line">
                {task.notes}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
              No additional notes provided for this assessment.
            </div>
          )}

          {/* Checklist reminder */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 text-slate-700">
            <span className="font-bold text-slate-900 block">Assessment Verification:</span>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Have you completed and submitted this evaluation with your college instructor?</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          {!isCompleted ? (
            <button
              type="button"
              onClick={handleConfirmCompletion}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark As Completed (+{earnedCoins} Coins 🪙)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmCompletion}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
            >
              <span>Mark as Incomplete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
