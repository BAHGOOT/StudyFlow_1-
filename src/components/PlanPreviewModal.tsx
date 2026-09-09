import { useState, useEffect } from 'react';
import { Course, Task, PlannedSession, TodayPlanItem } from '../types';
import { SmartStudyPlanGenerationResult, formatDuration } from '../utils/smartPlanner';
import {
  Sparkles,
  Calendar,
  Clock,
  Check,
  X,
  Trash2,
  CalendarDays,
  MoveRight,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface PlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftResult: SmartStudyPlanGenerationResult | null;
  courses: Course[];
  tasks: Task[];
  onConfirmApplyPlan: (
    confirmedWeeklyPlan: PlannedSession[],
    confirmedTasks: Task[],
    confirmedTodayPlan: TodayPlanItem[]
  ) => void;
}

const DAYS_OF_WEEK: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function PlanPreviewModal({
  isOpen,
  onClose,
  draftResult,
  courses,
  tasks,
  onConfirmApplyPlan,
}: PlanPreviewModalProps) {
  const [draftWeeklyPlan, setDraftWeeklyPlan] = useState<PlannedSession[]>([]);
  const [draftTasks, setDraftTasks] = useState<Task[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');

  useEffect(() => {
    if (draftResult) {
      setDraftWeeklyPlan([...draftResult.weeklyPlan]);
      setDraftTasks([...draftResult.allTasks]);

      // Set default selected day to current weekday or Monday
      const currentDayName = (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()] || 'Monday') as typeof selectedDayTab;
      setSelectedDayTab(currentDayName);
    }
  }, [draftResult]);

  if (!isOpen || !draftResult) return null;

  const getCourse = (courseId: string) => courses.find((c) => c.id === courseId);
  const getTask = (taskId: string) => draftTasks.find((t) => t.id === taskId) || tasks.find((t) => t.id === taskId);

  // Helper to change day of a session
  const handleChangeSessionDay = (
    sessionId: string,
    newDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  ) => {
    setDraftWeeklyPlan((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, day: newDay } : session))
    );
  };

  // Helper to update duration
  const handleUpdateDuration = (sessionId: string, deltaMinutes: number) => {
    setDraftWeeklyPlan((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          const nextDuration = Math.max(15, Math.min(240, session.durationMinutes + deltaMinutes));
          return { ...session, durationMinutes: nextDuration };
        }
        return session;
      })
    );
  };

  // Helper to remove session from draft
  const handleRemoveSession = (sessionId: string) => {
    setDraftWeeklyPlan((prev) => prev.filter((s) => s.id !== sessionId));
  };

  // Confirm and Apply
  const handleConfirm = () => {
    // Generate updated todayPlan items based on draft weekly plan
    const todayDayName = (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()] || 'Monday') as typeof selectedDayTab;
    const todaySessions = draftWeeklyPlan.filter((s) => s.day === todayDayName);

    const updatedTodayPlan: TodayPlanItem[] = todaySessions.map((session) => {
      const task = getTask(session.taskId);
      return {
        id: `today-${session.taskId}-${Date.now()}`,
        taskId: session.taskId,
        taskName: task?.name || 'Study Session',
        courseId: task?.courseId || '',
        timeSlot: session.timeSlot,
        durationMinutes: session.durationMinutes,
        completed: session.completed || false,
      };
    });

    onConfirmApplyPlan(draftWeeklyPlan, draftTasks, updatedTodayPlan);
    onClose();
  };

  // Calculated draft summary metrics
  const totalMinutes = draftWeeklyPlan.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const sessionsCount = draftWeeklyPlan.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-800">
                  Draft Mode
                </span>
                <h2 className="text-lg font-bold font-display text-white">
                  Review & Edit AI Study Plan
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Preview generated study sessions before saving to Cloud Firestore. Customize days & durations as needed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Draft Summary Banner */}
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-indigo-950">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Total Planned Study: <strong>{totalHours}h</strong> ({totalMinutes} mins)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Sessions: <strong>{sessionsCount} study blocks</strong></span>
            </div>
            {draftResult.restDay && (
              <div className="flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected Rest Day: <strong>{draftResult.restDay}</strong></span>
              </div>
            )}
          </div>
          <span className="text-[11px] text-slate-500 italic">
            Changes will only be applied when you click "Confirm & Apply Plan".
          </span>
        </div>

        {/* Day Navigation Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {DAYS_OF_WEEK.map((day) => {
              const daySessions = draftWeeklyPlan.filter((s) => s.day === day);
              const isSelected = day === selectedDayTab;
              const isRestDay = day === draftResult.restDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayTab(day)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isRestDay
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{day}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-indigo-700 text-white'
                        : isRestDay
                        ? 'bg-emerald-200 text-emerald-900 font-extrabold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isRestDay ? 'Rest' : `${daySessions.length}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Sessions for Selected Day */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {selectedDayTab === draftResult.restDay && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-medium">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="font-bold text-sm block text-emerald-950">Designated Resting Day ({selectedDayTab})</strong>
                No intense study sessions scheduled to preserve cognitive focus and prevent burnout.
              </div>
            </div>
          )}

          {draftWeeklyPlan.filter((s) => s.day === selectedDayTab).length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No study sessions scheduled for {selectedDayTab}</p>
              <p className="text-xs text-slate-500 mt-1">
                You can move sessions here from other days or confirm the plan as is.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {draftWeeklyPlan
                .filter((s) => s.day === selectedDayTab)
                .map((session) => {
                  const task = getTask(session.taskId);
                  const course = task ? getCourse(task.courseId) : null;

                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: course?.accentHex || '#6366f1' }}
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                              {course?.name || 'General'}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {session.timeSlot}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {task?.name || 'Study Task'}
                          </h4>
                          {task?.urgencyReason && (
                            <p className="text-xs text-slate-500 italic line-clamp-1">
                              “{task.urgencyReason}”
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls for Session */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Day Selector Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 font-semibold">Day:</span>
                          <select
                            value={session.day}
                            onChange={(e) =>
                              handleChangeSessionDay(
                                session.id,
                                e.target.value as typeof selectedDayTab
                              )
                            }
                            className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                          >
                            {DAYS_OF_WEEK.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Duration Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateDuration(session.id, -15)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                            title="Subtract 15 minutes"
                          >
                            -15m
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-900">
                            {session.durationMinutes}m
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateDuration(session.id, 15)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                            title="Add 15 minutes"
                          >
                            +15m
                          </button>
                        </div>

                        {/* Delete session button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSession(session.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove session from plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Clicking "Confirm & Apply Plan" will update your Firestore schedule.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm & Apply Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
