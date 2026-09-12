import { useState, useEffect, FormEvent } from 'react';
import { Task, Course } from '../types';
import {
  X,
  Award,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface ScorePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  courses: Course[];
  onSaveScore: (taskId: string, achievedGrade: number, maxGrade?: number, weightPercentage?: number) => void;
}

export function ScorePromptModal({
  isOpen,
  onClose,
  task,
  courses,
  onSaveScore,
}: ScorePromptModalProps) {
  const [achievedScore, setAchievedScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('100');
  const [weight, setWeight] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (task) {
      setAchievedScore(
        typeof task.achievedGrade === 'number' ? String(task.achievedGrade) : ''
      );
      setMaxScore(
        typeof task.maxGrade === 'number' && task.maxGrade > 0
          ? String(task.maxGrade)
          : '100'
      );
      setWeight(
        typeof task.weightPercentage === 'number' ? String(task.weightPercentage) : ''
      );
      setError('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const course = courses.find((c) => c.id === task.courseId);

  const numAchieved = parseFloat(achievedScore);
  const numMax = parseFloat(maxScore) || 100;
  const numWeight = parseFloat(weight);

  const isValidNumbers = !isNaN(numAchieved) && numMax > 0 && numAchieved >= 0;
  const percentage = isValidNumbers ? Math.round((numAchieved / numMax) * 1000) / 10 : null;
  const isMastered = percentage !== null && percentage >= 80;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isNaN(numAchieved) || numAchieved < 0) {
      setError('Please enter a valid achieved score.');
      return;
    }
    if (numMax <= 0) {
      setError('Max points must be greater than 0.');
      return;
    }
    if (numAchieved > numMax * 1.5) {
      setError(`Score seems high compared to max points (${numMax}). Please check.`);
      return;
    }

    onSaveScore(
      task.id,
      numAchieved,
      numMax,
      !isNaN(numWeight) && numWeight > 0 ? numWeight : undefined
    );
    onClose();
  };

  return (
    <div
      id="score-prompt-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto overscroll-contain"
    >
      <div
        id="score-prompt-modal-container"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in zoom-in-95 duration-150 overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">
                Record Assessment Score
              </h3>
              <p className="text-xs text-slate-500">Post-exam evaluation & adaptive feedback</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Info Pill */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1">
                {course && (
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white uppercase tracking-wider"
                    style={{ backgroundColor: course.accentHex }}
                  >
                    {course.code}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                  {task.type}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate">{task.name}</h4>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Scores input grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Your Score *
              </label>
              <div className="relative">
                <input
                  id="achieved-score-input"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  placeholder="e.g. 16"
                  value={achievedScore}
                  onChange={(e) => {
                    setAchievedScore(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Max Points *
              </label>
              <div className="relative">
                <input
                  id="max-score-input"
                  type="number"
                  step="0.1"
                  min="1"
                  required
                  placeholder="e.g. 20 or 100"
                  value={maxScore}
                  onChange={(e) => {
                    setMaxScore(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Course Weight (Optional) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Course Weight (% of Final Grade)
              </label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <div className="relative">
              <input
                id="weight-percentage-input"
                type="number"
                step="0.5"
                min="0"
                max="100"
                placeholder="e.g. 15 (means 15% of course grade)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
              <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Live Adaptive Performance Feedback Box */}
          {percentage !== null && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isMastered
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  {isMastered ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Score: {percentage}% — Concept Mastered</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Score: {percentage}% — Requires Remediation</span>
                    </>
                  )}
                </span>
                <span className="text-xs font-mono font-bold">
                  {numAchieved}/{numMax} pts
                </span>
              </div>

              <p className="text-xs leading-relaxed">
                {isMastered ? (
                  <>
                    Great job! You met the 80% mastery threshold. Your normal study plan pace will be maintained.
                  </>
                ) : (
                  <>
                    Score is below the 80% mastery threshold. StudyFlow will automatically generate <strong>1–2 targeted remedial review & practice sessions</strong> and schedule them into your upcoming free study windows.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save & Update Study Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
