import { useState, useEffect, useRef } from 'react';
import { Task, Course, TodayPlanItem, StudyAvailability, StudentProfile, CollegeLecture } from '../types';
import {
  Flame,
  Play,
  Pause,
  Maximize2,
  SkipForward,
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Check,
  Trees,
  Award,
  Info,
  Car,
} from 'lucide-react';
import {
  getDoThisNowTask,
  getTodayCapacityMetrics,
  formatDeadlineRelative,
  formatDuration,
} from '../utils/smartPlanner';
import { SkipTaskModal } from './SkipTaskModal';

export interface DashboardFocusSessionInfo {
  activeTask: Task | null;
  isMinimized: boolean;
  isActive: boolean;
  secondsRemaining: number;
  initialSeconds: number;
  formattedTime: string;
  progressPercent: number;
  mode: 'focus' | 'short_break' | 'long_break';
  pomodoroCount: number;
  toggleActive: () => void;
  expandSession: () => void;
  abandonSession: () => void;
}

interface DashboardProps {
  tasks: Task[];
  courses: Course[];
  todayPlan: TodayPlanItem[];
  availability: StudyAvailability;
  profile: StudentProfile;
  lectures?: CollegeLecture[];
  focusSession?: DashboardFocusSessionInfo;
  onMainTaskVisibilityChange?: (isVisible: boolean) => void;
  onStartTask: (task: Task) => void;
  onCheckAssessment?: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onTogglePlanItemComplete: (planItemId: string) => void;
  onRescheduleTask?: (taskId: string, option: 'tomorrow' | 'friday' | 'weekend' | 'next_week') => void;
  onNavigateToTasks: () => void;
  onNavigateToCourses: () => void;
  onNavigateToSettings: () => void;
  onNavigateToForest?: () => void;
  onOpenCollegeSchedule?: () => void;
}

export function Dashboard({
  tasks,
  courses,
  todayPlan,
  availability,
  profile,
  lectures = [],
  focusSession,
  onMainTaskVisibilityChange,
  onStartTask,
  onCheckAssessment,
  onToggleTaskComplete,
  onTogglePlanItemComplete,
  onRescheduleTask,
  onNavigateToTasks,
  onNavigateToCourses,
  onNavigateToSettings,
  onNavigateToForest,
  onOpenCollegeSchedule,
}: DashboardProps) {
  const [skippedTaskIds, setSkippedTaskIds] = useState<string[]>([]);
  const [taskToSkip, setTaskToSkip] = useState<Task | null>(null);
  const [rescheduleNotice, setRescheduleNotice] = useState<string | null>(null);

  const mainTaskHeroRef = useRef<HTMLDivElement | null>(null);

  // Monitor visibility of the main task in viewport
  useEffect(() => {
    if (!onMainTaskVisibilityChange) return;

    if (!mainTaskHeroRef.current) {
      onMainTaskVisibilityChange(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onMainTaskVisibilityChange(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(mainTaskHeroRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onMainTaskVisibilityChange]);

  // Get current greeting based on time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Find course helper
  const getCourse = (courseId: string) => courses.find((c) => c.id === courseId);

  // Active uncompleted tasks
  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  // Top task for DO THIS NOW
  const doThisNowTask = getDoThisNowTask(tasks, skippedTaskIds);
  const doThisNowCourse = doThisNowTask ? getCourse(doThisNowTask.courseId) : null;
  const isDoThisNowAssessment = doThisNowTask?.type === 'Exam' || doThisNowTask?.type === 'Quiz';

  // Sort Today's Plan items strictly by task Priority Score descending
  const sortedTodayPlan = [...todayPlan].sort((a, b) => {
    const taskA = tasks.find((t) => t.id === a.taskId);
    const taskB = tasks.find((t) => t.id === b.taskId);
    const isCompA = a.completed || (taskA && taskA.status === 'completed');
    const isCompB = b.completed || (taskB && taskB.status === 'completed');
    if (isCompA !== isCompB) return isCompA ? 1 : -1;
    const scoreA = taskA?.smartPriorityScore || 0;
    const scoreB = taskB?.smartPriorityScore || 0;
    return scoreB - scoreA;
  });

  const handleOpenSkipModal = () => {
    if (doThisNowTask) {
      setTaskToSkip(doThisNowTask);
    }
  };

  const handleConfirmSkipAndReschedule = (
    taskId: string,
    rescheduleOption: 'tomorrow' | 'friday' | 'weekend' | 'next_week'
  ) => {
    setSkippedTaskIds((prev) => [...prev, taskId]);
    if (onRescheduleTask) {
      onRescheduleTask(taskId, rescheduleOption);
    }
    const optionLabels = {
      tomorrow: 'tomorrow',
      friday: 'this Friday',
      weekend: 'this weekend',
      next_week: 'next week',
    };
    setRescheduleNotice(`Task was skipped and rescheduled for ${optionLabels[rescheduleOption]}.`);
    setTimeout(() => setRescheduleNotice(null), 5000);
  };

  // Today's study capacity calculation
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as keyof StudyAvailability['dailyHours'];
  const capacity = getTodayCapacityMetrics(todayPlan, availability, todayDayName);

  // Upcoming deadlines (next 4 urgent active tasks)
  const upcomingDeadlines = [...activeTasks]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  // Course workload metrics
  const courseWorkloadMap = courses.map((course) => {
    const courseTasks = tasks.filter((t) => t.courseId === course.id && t.status !== 'completed');
    const totalMinutes = courseTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
    const hours = Math.round((totalMinutes / 60) * 10) / 10;
    return {
      course,
      hours,
      activeCount: courseTasks.length,
    };
  });

  const maxWorkloadHours = Math.max(...courseWorkloadMap.map((c) => c.hours), 10);

  return (
    <div className="space-y-8 pb-16">
      {/* Skip Task Second Verification Modal */}
      <SkipTaskModal
        isOpen={!!taskToSkip}
        task={taskToSkip}
        course={taskToSkip ? getCourse(taskToSkip.courseId) || null : null}
        onClose={() => setTaskToSkip(null)}
        onConfirmSkipAndReschedule={handleConfirmSkipAndReschedule}
      />

      {/* Header section */}
      <div id="dashboard-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            {timeGreeting}, {profile.name} 👋
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 font-medium">
            “Let’s make progress on your semester.”
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenCollegeSchedule && (
            <button
              onClick={onOpenCollegeSchedule}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <Car className="w-3.5 h-3.5 text-indigo-600" />
              <span>Timetable & Commute</span>
            </button>
          )}

          {onNavigateToForest && (
            <button
              onClick={onNavigateToForest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Trees className="w-3.5 h-3.5 text-emerald-600" />
              <span>Forest Grove 🌲</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Week 3 • Fall 2026</span>
          </span>
        </div>
      </div>

      {rescheduleNotice && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-900 flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{rescheduleNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DO THIS NOW 🔥 CARD — VISUALLY DOMINATES THE DASHBOARD                 */}
      {/* ========================================================================= */}
      {doThisNowTask ? (
        <section
          id="do-this-now-card"
          ref={mainTaskHeroRef}
          aria-label="Do this now priority task"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-xl shadow-indigo-950/20 border border-indigo-900/50"
        >
          {/* Subtle ambient glow element */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-0 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Tag / Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-widest">
                <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                <span>DO THIS NOW</span>
              </div>

              {/* Priority badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">Priority:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {doThisNowTask.smartPriorityScore >= 80 ? 'Critical' : 'High Priority'}
                </span>
                <span className="text-xs text-indigo-300/70 font-mono font-medium ml-1">
                  (Score: {doThisNowTask.smartPriorityScore})
                </span>
              </div>
            </div>

            {/* Main Task Title & Course */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-block px-3 py-1 rounded-lg text-xs font-semibold text-white tracking-wide"
                    style={{ backgroundColor: doThisNowCourse?.accentHex || '#4f46e5' }}
                  >
                    {doThisNowCourse?.name || 'Academic Course'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {doThisNowCourse?.code || ''}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {doThisNowTask.type}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white leading-tight">
                  {doThisNowTask.name}
                </h2>

                {/* Description of what the student has for this task */}
                {doThisNowTask.notes && (
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Task Description & Details:</span>
                    </div>
                    <p className="text-slate-100 leading-relaxed whitespace-pre-line">
                      {doThisNowTask.notes}
                    </p>
                  </div>
                )}

                {/* Reason Explanation */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200 block mb-0.5">
                        Reason
                      </span>
                      <p className="text-sm sm:text-base text-slate-100 font-medium leading-snug">
                        “{doThisNowTask.urgencyReason || 'Your deadline is close and you still have time remaining.'}”
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata details row */}
                <div className="flex flex-wrap items-center gap-5 pt-1 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      Estimated time:{' '}
                      <strong className="text-white font-semibold">
                        {formatDuration(doThisNowTask.estimatedMinutes)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      Due:{' '}
                      <strong className="text-rose-300 font-semibold">
                        {formatDeadlineRelative(doThisNowTask.deadline).text}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Column */}
              <div className="lg:col-span-1 flex flex-col justify-center items-stretch gap-3 lg:border-l lg:border-white/10 lg:pl-8">
                {focusSession?.activeTask?.id === doThisNowTask.id ? (
                  /* Running/minimized focus session timer directly on the task */
                  <div className="w-full p-4 rounded-2xl bg-indigo-950/90 border border-indigo-500/50 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{focusSession.mode === 'focus' ? 'Focus Session Active' : 'Break in Progress'}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-200">
                        Cycle #{focusSession.pomodoroCount}
                      </span>
                    </div>

                    {/* Big Countdown Timer */}
                    <div className="text-center py-1">
                      <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {focusSession.formattedTime}
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${focusSession.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={focusSession.toggleActive}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                        title={focusSession.isActive ? 'Pause timer' : 'Resume timer'}
                      >
                        {focusSession.isActive ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={focusSession.expandSession}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-colors flex items-center justify-center gap-1.5"
                        title="Expand to full screen focus view"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Expand</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={focusSession.abandonSession}
                      className="w-full text-center text-[11px] text-rose-300/80 hover:text-rose-200 pt-1"
                    >
                      Abandon Session
                    </button>
                  </div>
                ) : isDoThisNowAssessment ? (
                  <button
                    id="do-this-now-check-assessment"
                    onClick={() => onCheckAssessment && onCheckAssessment(doThisNowTask)}
                    className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/30 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] group"
                  >
                    <Award className="w-5 h-5 text-slate-950" />
                    <span>Check Off Assessment</span>
                  </button>
                ) : focusSession?.activeTask && focusSession.activeTask.id !== doThisNowTask.id ? (
                  <button
                    id="do-this-now-another-running"
                    disabled
                    title={`Session for "${focusSession.activeTask.name}" is already running. Please complete or pause it first.`}
                    className="w-full py-4 px-6 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm border border-slate-700 cursor-not-allowed flex items-center justify-center gap-2.5 opacity-80"
                  >
                    <Play className="w-4 h-4 fill-current opacity-40" />
                    <span>Another Session In Progress</span>
                  </button>
                ) : (
                  <button
                    id="do-this-now-start-task"
                    onClick={() => onStartTask(doThisNowTask)}
                    className="w-full py-4 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] group"
                  >
                    <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                    <span>Start Task</span>
                  </button>
                )}

                <button
                  id="do-this-now-skip-task"
                  onClick={handleOpenSkipModal}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Skip for now</span>
                </button>

                {skippedTaskIds.length > 0 && (
                  <button
                    onClick={() => setSkippedTaskIds([])}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 text-center underline decoration-dotted"
                  >
                    Reset skipped tasks ({skippedTaskIds.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : tasks.length === 0 ? (
        <section
          id="welcome-new-student-banner"
          className="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-10 shadow-lg border border-indigo-800/40 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-4 text-indigo-300">
            <Sparkles className="w-7 h-7" />
          </div>
          {courses.length > 0 ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                Courses set up! Next step: Add your tasks, {profile.name} 🚀
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
                You have <strong className="text-indigo-200">{courses.length} enrolled course{courses.length > 1 ? 's' : ''}</strong> ({courses.map((c) => c.name).slice(0, 4).join(', ')}{courses.length > 4 ? '...' : ''}). Add your upcoming assignments, quizzes, and readings to auto-generate your balanced daily study schedule!
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onNavigateToTasks}
                  className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  + Create Your First Task
                </button>
                <button
                  onClick={onNavigateToCourses}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
                >
                  View Enrolled Courses ({courses.length})
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                Welcome to your semester workspace, {profile.name}!
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
                Your account is fresh and ready. Add your courses and upcoming tasks to unlock automated priority scores, study capacity balancing, and focus timers.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onNavigateToCourses}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  + Add Your Courses
                </button>
                <button
                  onClick={onNavigateToTasks}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
                >
                  + Create First Task
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section
          id="all-tasks-completed-banner"
          className="rounded-3xl bg-emerald-50 border border-emerald-200 p-8 text-center text-emerald-900 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold font-display">All caught up for right now!</h2>
          <p className="text-sm text-emerald-700 mt-1 max-w-md mx-auto">
            You have completed all urgent tasks. Take a well-deserved rest or review upcoming semester milestones.
          </p>
        </section>
      )}

      {/* Main Grid: Today's Plan on left (60%), Capacity & Deadlines & Workload on right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* 2. TODAY'S PLAN (Left 7 Cols) — ORDERED BY PRIORITY                       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                  TODAY'S PLAN (Ordered by Priority)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered by priority score, upcoming deadlines, and study capacity
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Tuesday, Sep 8
              </span>
            </div>

            {/* Timeline Task Items */}
            <div className="space-y-3.5">
              {sortedTodayPlan.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No study sessions scheduled for today</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {tasks.length === 0
                      ? courses.length > 0
                        ? `You have ${courses.length} course${courses.length > 1 ? 's' : ''} enrolled! Add your tasks to generate today's study schedule.`
                        : 'Add your courses and tasks to automatically generate your optimized study schedule.'
                      : 'All scheduled sessions for today are completed! Take a break.'}
                  </p>
                  {tasks.length === 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {courses.length === 0 && (
                        <button
                          onClick={onNavigateToCourses}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          + Add Course
                        </button>
                      )}
                      <button
                        onClick={onNavigateToTasks}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        + Add Task
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                sortedTodayPlan.map((planItem) => {
                const task = tasks.find((t) => t.id === planItem.taskId);
                const course = task ? getCourse(task.courseId) : null;
                const isCompleted = planItem.completed || (task && task.status === 'completed');
                const isAssessment = task?.type === 'Quiz' || task?.type === 'Exam';

                return (
                  <div
                    key={planItem.id}
                    id={`plan-item-${planItem.id}`}
                    className={`group relative flex items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-150 ${
                      isCompleted
                        ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                        : isAssessment
                        ? 'bg-amber-50/30 border-amber-200/90 text-slate-800'
                        : 'bg-white border-slate-200/90 hover:border-indigo-200 hover:shadow-xs text-slate-800'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Checkbox */}
                      <button
                        type="button"
                        id={`checkbox-plan-${planItem.id}`}
                        onClick={() => {
                          onTogglePlanItemComplete(planItem.id);
                          if (task) onToggleTaskComplete(task.id);
                        }}
                        className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-indigo-500 bg-white'
                        }`}
                        aria-label="Toggle task completion"
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Scheduled Time badge */}
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-1 rounded-md shrink-0 ${
                          isCompleted
                            ? 'bg-slate-200/60 text-slate-500'
                            : 'bg-slate-100 text-slate-700 font-bold'
                        }`}
                      >
                        {planItem.timeSlot}
                      </span>

                      {/* Content */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task?.name || 'Academic Assignment'}
                          </p>
                          {task?.smartPriorityScore && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              P: {task.smartPriorityScore}
                            </span>
                          )}
                        </div>

                        {/* Task description preview if available */}
                        {task?.notes && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                            {task.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                          {course && (
                            <span
                              className="font-medium"
                              style={{ color: isCompleted ? '#94a3b8' : course.accentHex }}
                            >
                              {course.name}
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDuration(planItem.durationMinutes)}</span>
                          <span>•</span>
                          <span
                            className={`font-medium ${
                              isCompleted
                                ? 'text-slate-400'
                                : planItem.durationMinutes >= 60
                                ? 'text-amber-600'
                                : 'text-slate-600'
                            }`}
                          >
                            {planItem.durationMinutes >= 60 ? 'High priority' : 'Medium priority'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    {!isCompleted && task && (
                      isAssessment ? (
                        <button
                          id={`check-plan-assessment-${task.id}`}
                          onClick={() => onCheckAssessment && onCheckAssessment(task)}
                          className="shrink-0 ml-3 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-700" />
                          <span>Check</span>
                        </button>
                      ) : focusSession?.activeTask?.id === task.id ? (
                        <button
                          id={`active-plan-task-${task.id}`}
                          onClick={focusSession.expandSession}
                          className="shrink-0 ml-3 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs animate-pulse cursor-pointer"
                          title="This task is actively running. Click to view session."
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Active</span>
                        </button>
                      ) : focusSession?.activeTask ? (
                        <button
                          id={`disabled-plan-task-${task.id}`}
                          disabled
                          title="Another focus session is currently running. Please finish or pause it first."
                          className="shrink-0 ml-3 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-medium text-xs flex items-center gap-1.5 cursor-not-allowed opacity-60"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span className="hidden sm:inline">Start</span>
                        </button>
                      ) : (
                        <button
                          id={`start-plan-task-${task.id}`}
                          onClick={() => onStartTask(task)}
                          className="shrink-0 ml-3 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span className="hidden sm:inline">Start</span>
                        </button>
                      )
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT COLUMN: Capacity, Upcoming, Workload                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* ======================================================================= */}
          {/* 3A. TODAY'S CAPACITY CARD                                               */}
          {/* ======================================================================= */}
          <section
            id="today-capacity-card"
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-base text-slate-900">
                Today's study capacity
              </h3>
              <div className="flex items-center gap-2">
                {onOpenCollegeSchedule && (
                  <button
                    onClick={onOpenCollegeSchedule}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Car className="w-3 h-3" />
                    <span>Commute & Classes</span>
                  </button>
                )}
                <button
                  onClick={onNavigateToSettings}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-display text-slate-900">
                  {capacity.plannedHoursFormatted}
                </span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  planned
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-500">
                {capacity.availableHoursFormatted} available
              </div>
            </div>

            {/* Progress bar (e.g. 92%) */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${capacity.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>{capacity.percentage}% utilized</span>
              <span className="text-indigo-700 font-semibold">
                “{capacity.remainingText}”
              </span>
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 3B. UPCOMING DEADLINES                                                  */}
          {/* ======================================================================= */}
          <section
            id="upcoming-deadlines-card"
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-slate-900 tracking-tight">
                UPCOMING
              </h3>
              <button
                onClick={onNavigateToTasks}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">No upcoming deadlines.</p>
                </div>
              ) : (
                upcomingDeadlines.map((task) => {
                  const relative = formatDeadlineRelative(task.deadline);
                  const course = getCourse(task.courseId);

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-semibold text-slate-800 truncate">{task.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          {course && (
                            <span
                              className="font-medium"
                              style={{ color: course.accentHex }}
                            >
                              {course.name}
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDuration(task.estimatedMinutes)}</span>
                        </p>
                      </div>

                      {/* Visual Urgency Indicator */}
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          relative.urgency === 'critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : relative.urgency === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {relative.text}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 3C. WORKLOAD OVERVIEW                                                   */}
          {/* ======================================================================= */}
          <section
            id="workload-overview-card"
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 tracking-tight">
                  WORKLOAD OVERVIEW
                </h3>
                <p className="text-xs text-slate-500">Remaining study hours by course</p>
              </div>
              <button
                onClick={onNavigateToCourses}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Courses
              </button>
            </div>

            {/* Course Workload Bars */}
            <div className="space-y-3.5">
              {courseWorkloadMap.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">No courses added yet.</p>
                  <button
                    onClick={onNavigateToCourses}
                    className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                  >
                    + Add your first course
                  </button>
                </div>
              ) : (
                courseWorkloadMap.map(({ course, hours }) => {
                  const percent = Math.min(100, Math.round((hours / maxWorkloadHours) * 100));

                  return (
                    <div key={course.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: course.accentHex }}
                          />
                          {course.name}
                        </span>
                        <span className="font-mono font-bold text-slate-700">{hours} hours</span>
                      </div>

                      {/* Visual bar matching 2026 SaaS aesthetic */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: course.accentHex,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
