import { useState } from 'react';
import { Course, Task, PlannedSession, StudyAvailability, CollegeLecture } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  Check,
  CalendarDays,
  Info,
  Calendar,
  Award,
  BookOpen,
  Car,
  FileCheck2,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { formatDuration } from '../utils/smartPlanner';

interface PlannerProps {
  weeklyPlan: PlannedSession[];
  tasks: Task[];
  courses: Course[];
  availability: StudyAvailability;
  lectures?: CollegeLecture[];
  onToggleSessionComplete: (sessionId: string) => void;
  onRegeneratePlan: () => void;
  onOpenCollegeSchedule?: () => void;
  onCheckAssessment?: (task: Task) => void;
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

export function Planner({
  weeklyPlan,
  tasks,
  courses,
  availability,
  lectures = [],
  onToggleSessionComplete,
  onRegeneratePlan,
  onOpenCollegeSchedule,
  onCheckAssessment,
}: PlannerProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const getCourse = (courseId: string) => courses.find((c) => c.id === courseId);
  const getTask = (taskId: string) => tasks.find((t) => t.id === taskId);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      onRegeneratePlan();
      setIsRegenerating(false);
      setFeedbackToast(
        `Plan rebalanced across your weekly study capacity (${Object.values(availability.dailyHours).reduce((a, b) => a + b, 0)}h) and urgent deadlines.`
      );
      setTimeout(() => setFeedbackToast(null), 5000);
    }, 600);
  };

  // Calculate lecture hours for a given day
  const getDayLectureStats = (day: string) => {
    const dayLectures = lectures.filter((l) => l.day === day);
    let totalMinutes = 0;
    dayLectures.forEach((l) => {
      const [sh, sm] = l.startTime.split(':').map(Number);
      const [eh, em] = l.endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) totalMinutes += diff;
    });
    return {
      count: dayLectures.length,
      hours: Math.round((totalMinutes / 60) * 10) / 10,
    };
  };

  // Month summary metrics
  const totalWeeklyCapacity = Object.values(availability.dailyHours).reduce((a, b) => a + b, 0);
  const estimatedMonthlyCapacity = totalWeeklyCapacity * 4;
  const examsThisMonth = tasks.filter((t) => t.type === 'Exam' || t.type === 'Quiz');
  const activeExams = examsThisMonth.filter((t) => t.status !== 'completed');
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  // Dynamic week and month context
  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  const weekRangeStr = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div id="planner-page" className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Academic Schedule & Planner
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Distributed across your daily study availability, college lectures, and travel times.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenCollegeSchedule && (
            <button
              type="button"
              onClick={onOpenCollegeSchedule}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors shadow-2xs"
            >
              <Car className="w-3.5 h-3.5 text-indigo-600" />
              <span>College Timetable & Commute</span>
            </button>
          )}

          {/* Regenerate Plan Button */}
          <button
            id="regenerate-plan-btn"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-75 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Remaking Study Plan...' : 'AI Remake Study Plan'}</span>
          </button>
        </div>
      </div>

      {/* Empty Plan Helper Banner */}
      {weeklyPlan.length === 0 && (
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Ready to Generate Your Study Plan</span>
            </div>
            <p className="text-xs text-indigo-800/80 max-w-xl">
              Add your courses, lectures, or assignments, then click <strong>AI Remake Study Plan</strong> to calculate a personalized weekly study schedule that balances class hours, commute, and upcoming deadlines.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Study Plan</span>
          </button>
        </div>
      )}

      {/* Week / Month View Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Toggle between Week and Month Summary */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span>Week View & Sessions</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Month Summary ({now.toLocaleDateString('en-US', { month: 'short' })})</span>
          </button>
        </div>

        {/* Date Context */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          {viewMode === 'week' ? (
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span>Current Week: {weekRangeStr}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200">
              <span>Semester Month Overview: {currentMonthName}</span>
            </span>
          )}
        </div>

        {/* Algorithm Factors Notice */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-indigo-50/60 px-3.5 py-1.5 rounded-xl border border-indigo-100/60">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            {viewMode === 'week' ? 'Rebalanced by daily capacity & classes' : '4-Week Semester Workload Projection'}
          </span>
        </div>
      </div>

      {feedbackToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WEEK VIEW (Default)                                                    */}
      {/* ========================================================================= */}
      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const currentDayOfWeekName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
            const isToday = day === currentDayOfWeekName;
            const daySessions = weeklyPlan.filter((s) => s.day === day);
            const dayHoursAvail = availability.dailyHours[day] ?? 2;
            const dayPlannedMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
            const lecStats = getDayLectureStats(day);

            return (
              <div
                key={day}
                id={`planner-day-${day.toLowerCase()}`}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all ${
                  isToday
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Day Header */}
                <div className="pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-display font-bold text-xs uppercase tracking-wider ${
                        isToday ? 'text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-indigo-600 text-white">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-medium">
                    <span>Cap: {dayHoursAvail}h</span>
                    <span>{formatDuration(dayPlannedMinutes)}</span>
                  </div>

                  {/* College classes banner for this day */}
                  {lecStats.count > 0 && (
                    <div className="mt-2 py-1 px-2 rounded-lg bg-amber-50 border border-amber-200/70 text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                      <span>🏛️</span>
                      <span>{lecStats.count} college {lecStats.count === 1 ? 'class' : 'classes'} ({lecStats.hours}h)</span>
                    </div>
                  )}
                </div>

                {/* Day Sessions List */}
                <div className="space-y-2.5 min-h-[140px]">
                  {daySessions.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6 text-center text-slate-400 text-xs italic">
                      Rest or open study
                    </div>
                  ) : (
                    daySessions.map((session) => {
                      const task = getTask(session.taskId);
                      const course = task ? getCourse(task.courseId) : null;
                      const isCompleted = session.completed || (task && task.status === 'completed');
                      const isAssessment = task?.type === 'Quiz' || task?.type === 'Exam';

                      return (
                        <div
                          key={session.id}
                          id={`session-card-${session.id}`}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            isCompleted
                              ? 'bg-slate-50 border-slate-200 text-slate-400'
                              : isAssessment
                              ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                          }`}
                        >
                          {/* Course, type & duration */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className="font-bold truncate text-[11px]"
                              style={{
                                color: isCompleted ? '#94a3b8' : course?.accentHex || '#4f46e5',
                              }}
                            >
                              {course?.name || 'Course'}
                            </span>
                            <span className="font-mono font-semibold text-[10px] text-slate-500 shrink-0">
                              {formatDuration(session.durationMinutes)}
                            </span>
                          </div>

                          {/* Task Title */}
                          <p
                            className={`font-semibold line-clamp-2 ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task?.name || 'Scheduled study'}
                          </p>

                          {/* Description of what the student has for this task (if available) */}
                          {task?.notes && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic leading-tight">
                              {task.notes}
                            </p>
                          )}

                          {/* Actions: Untimed check for Quizzes/Exams, clean time slot display for normal study blocks (no Mark Done) */}
                          {isAssessment ? (
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  if (task && onCheckAssessment) {
                                    onCheckAssessment(task);
                                  }
                                }}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                }`}
                              >
                                <Award className="w-3 h-3 text-amber-700" />
                                <span>{isCompleted ? 'Checked Off' : 'Check Exam/Quiz'}</span>
                              </button>

                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                                {task.type}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{session.timeSlot}</span>
                              </span>
                              {isCompleted && (
                                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Completed</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. MONTH SUMMARY VIEW (In the same space)                                 */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Top Month Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monthly Planned Capacity
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
                {estimatedMonthlyCapacity}h <span className="text-xs font-normal text-slate-400">across 4 weeks</span>
              </div>
              <p className="text-xs text-indigo-600 font-medium mt-1">
                {totalWeeklyCapacity}h study commitment per week
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assessments & Evaluations
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-display mt-1">
                {examsThisMonth.length} <span className="text-xs font-normal text-slate-400">quizzes/exams</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {activeExams.length} upcoming • Untimed check-ins
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Task Milestones
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
                {completedTasks} / {totalTasks} <span className="text-xs font-normal text-slate-400">tasks</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {Math.round((completedTasks / (totalTasks || 1)) * 100)}% semester completion
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Courses
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-display mt-1">
                {courses.length} <span className="text-xs font-normal text-slate-400">courses</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Evenly distributed cognitive workload
              </p>
            </div>
          </div>

          {/* 4-Week Month Breakdown Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  September 2026 Academic Pacing (4-Week Roadmap)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overview of assignments, evaluations, and weekly focus targets for the month.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Week 1 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <strong className="text-xs font-bold text-slate-800">Week 1 (Sep 1–6)</strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Passed
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Semester kickoff and syllabus review completed. Foundation established.
                </p>
                <div className="text-[11px] text-slate-600 font-medium">
                  ✓ 15h logged • 3 tasks completed
                </div>
              </div>

              {/* Week 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <strong className="text-xs font-bold text-slate-800">Week 2 (Sep 7–13)</strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    Current Week
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-800">Key Deadlines:</div>
                  {tasks.filter((t) => t.status !== 'completed').slice(0, 3).length > 0 ? (
                    <ul className="text-slate-600 space-y-1 text-[11px]">
                      {tasks
                        .filter((t) => t.status !== 'completed')
                        .slice(0, 3)
                        .map((t) => (
                          <li key={t.id} className="truncate">• {t.name}</li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No deadlines scheduled</p>
                  )}
                </div>
                <div className="text-[11px] text-indigo-700 font-bold">
                  {totalWeeklyCapacity}h study target planned
                </div>
              </div>

              {/* Week 3 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <strong className="text-xs font-bold text-slate-800">Week 3 (Sep 14–20)</strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Upcoming
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-800">Key Deadlines:</div>
                  {tasks.filter((t) => t.status !== 'completed').slice(3, 6).length > 0 ? (
                    <ul className="text-slate-600 space-y-1 text-[11px]">
                      {tasks
                        .filter((t) => t.status !== 'completed')
                        .slice(3, 6)
                        .map((t) => (
                          <li key={t.id} className="truncate">• {t.name}</li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No deadlines scheduled</p>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {totalWeeklyCapacity}h study capacity reserved
                </div>
              </div>

              {/* Week 4 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <strong className="text-xs font-bold text-slate-800">Week 4 (Sep 21–27)</strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Exam Week
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-800">Evaluations:</div>
                  {activeExams.length > 0 ? (
                    <ul className="text-slate-600 space-y-1 text-[11px]">
                      {activeExams.slice(0, 2).map((e) => (
                        <li key={e.id} className="text-amber-800 font-bold truncate">⚠️ {e.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No exams scheduled</p>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  High cognitive focus allocation
                </div>
              </div>
            </div>

            {/* Course Workload Distribution for the Month */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Monthly Course Study Distribution
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {courses.map((c) => {
                  const courseTasks = tasks.filter((t) => t.courseId === c.id);
                  const totalCourseMinutes = courseTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
                  const approxMonthlyHours = Math.max(8, Math.round((totalCourseMinutes / 60) * 2));

                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.accentHex }}
                        />
                      </div>
                      <div className="text-base font-extrabold text-slate-900 font-display">
                        ~{approxMonthlyHours}h
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {courseTasks.length} milestones this month
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
