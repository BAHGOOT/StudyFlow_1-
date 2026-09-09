import { useState } from 'react';
import { Task, Course, PlannedSession, TodayPlanItem, StudyAvailability, CollegeLecture } from '../types';
import { AlertTriangle, Sparkles, X, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { generateSmartStudyPlanFromLecturesAndCourses } from '../utils/smartPlanner';

interface UnfinishedTaskRolloverBannerProps {
  tasks: Task[];
  courses: Course[];
  weeklyPlan: PlannedSession[];
  todayPlan: TodayPlanItem[];
  availability: StudyAvailability;
  lectures: CollegeLecture[];
  onApplyRollover: (
    updatedTasks: Task[],
    updatedWeeklyPlan: PlannedSession[],
    updatedTodayPlan: TodayPlanItem[]
  ) => Promise<void>;
}

export function UnfinishedTaskRolloverBanner({
  tasks,
  courses,
  weeklyPlan,
  todayPlan,
  availability,
  lectures,
  onApplyRollover,
}: UnfinishedTaskRolloverBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isDismissed) return null;

  // Detect past incomplete tasks
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const pastIncompleteTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    if (!t.deadline) return false;
    const taskDate = new Date(t.deadline);
    return taskDate.getTime() < todayStart.getTime();
  });

  if (pastIncompleteTasks.length === 0) return null;

  const handleRollover = async () => {
    setIsProcessing(true);
    try {
      // 1. Roll forward deadlines of overdue tasks to today or upcoming days
      const updatedTasks = tasks.map((t) => {
        const isPastIncomplete = pastIncompleteTasks.some((p) => p.id === t.id);
        if (isPastIncomplete) {
          return {
            ...t,
            deadline: todayStr, // Move deadline to today so planner schedules it
            notes: t.notes
              ? `${t.notes} [Rolled over on ${new Date().toLocaleDateString()}]`
              : `[Rolled over on ${new Date().toLocaleDateString()}]`,
          };
        }
        return t;
      });

      // 2. Re-run smart plan generator with updated tasks
      const result = generateSmartStudyPlanFromLecturesAndCourses({
        existingCourses: courses,
        existingTasks: updatedTasks,
        lectures,
        suggestedDailyHours: availability.dailyHours,
      });

      await onApplyRollover(result.allTasks, result.weeklyPlan, result.todayPlan);
      setIsDismissed(true);
    } catch (err) {
      console.error('Error rolling over tasks:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="unfinished-task-rollover-banner"
      className="bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-rose-500/15 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl p-4 sm:p-5 shadow-sm my-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Unfinished Tasks Detected ({pastIncompleteTasks.length})
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase tracking-wider">
                Action Recommended
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl font-medium">
              You have <strong>{pastIncompleteTasks.length} incomplete tasks</strong> from past dates (
              <span className="italic">
                {pastIncompleteTasks.slice(0, 2).map((t) => t.name).join(', ')}
                {pastIncompleteTasks.length > 2 ? ` and ${pastIncompleteTasks.length - 2} more` : ''}
              </span>
              ). Would you like to redistribute them into available free study windows this week?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={handleRollover}
            disabled={isProcessing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-amber-950 dark:text-amber-100 text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Redistributing...' : 'Rollover & Redistribute Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
