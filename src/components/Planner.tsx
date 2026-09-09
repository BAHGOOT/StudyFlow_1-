import { useState } from 'react';
import { Course, Task, PlannedSession, StudyAvailability, CollegeLecture } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Check,
  CalendarDays,
  Calendar,
  Award,
  BookOpen,
  Car,
  Building2,
  MapPin,
  CheckCircle2,
  ListTodo,
  Layers,
  ArrowRight,
  CalendarCheck,
  AlertCircle,
  Play,
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

const SHORT_DAYS: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

// Hourly timeline slots from 8 AM (08:00) to 10 PM (22:00)
const TIMELINE_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

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
  const currentDayOfWeekName = (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()] || 'Monday') as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>(currentDayOfWeekName);
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

  // Day navigation helper
  const handlePrevDay = () => {
    const currentIndex = DAYS_OF_WEEK.indexOf(selectedDay);
    const prevIndex = (currentIndex - 1 + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length;
    setSelectedDay(DAYS_OF_WEEK[prevIndex]);
  };

  const handleNextDay = () => {
    const currentIndex = DAYS_OF_WEEK.indexOf(selectedDay);
    const nextIndex = (currentIndex + 1) % DAYS_OF_WEEK.length;
    setSelectedDay(DAYS_OF_WEEK[nextIndex]);
  };

  // Format 24-hour integer into display time (e.g. 8 -> 8:00 AM, 16 -> 4:00 PM)
  const formatHourLabel = (hour: number) => {
    if (hour === 0 || hour === 24) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  // Get lectures for a specific day
  const getDayLectures = (day: string) => {
    return lectures.filter((l) => l.day === day);
  };

  // Calculate lecture hours for a given day
  const getDayLectureStats = (day: string) => {
    const dayLectures = getDayLectures(day);
    let totalMinutes = 0;
    dayLectures.forEach((l) => {
      const [sh, sm] = (l.startTime || '09:00').split(':').map(Number);
      const [eh, em] = (l.endTime || '10:00').split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) totalMinutes += diff;
    });
    return {
      count: dayLectures.length,
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      totalMinutes,
    };
  };

  // Get sessions for selected day
  const daySessions = weeklyPlan.filter((s) => s.day === selectedDay);
  const dayCapacity = availability.dailyHours[selectedDay] ?? 2;
  const dayPlannedMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const dayLectureStats = getDayLectureStats(selectedDay);
  const selectedDayLectures = getDayLectures(selectedDay);

  // Month summary metrics
  const totalWeeklyCapacity = Object.values(availability.dailyHours).reduce((a, b) => a + b, 0);
  const estimatedMonthlyCapacity = totalWeeklyCapacity * 4;
  const examsThisMonth = tasks.filter((t) => t.type === 'Exam' || t.type === 'Quiz');
  const activeExams = examsThisMonth.filter((t) => t.status !== 'completed');
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div id="planner-page" className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Academic Schedule & Smart Planner
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organized study timeline balanced with fixed college lectures, exams, and daily capacity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenCollegeSchedule && (
            <button
              type="button"
              onClick={onOpenCollegeSchedule}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
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
              <span>Ready to Generate Your Study Schedule</span>
            </div>
            <p className="text-xs text-indigo-800/80 max-w-xl">
              Add your courses, lectures, or assignments, then click <strong>AI Remake Study Plan</strong> to calculate a personalized hourly study schedule that balances class hours, commute, and upcoming deadlines.
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

      {/* View Switcher Bar (Day View / Week View / Month Summary) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Primary View Toggle Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            id="view-toggle-day"
            onClick={() => setViewMode('day')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Day View (Hourly Grid)</span>
          </button>

          <button
            type="button"
            id="view-toggle-week"
            onClick={() => setViewMode('week')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span>Week View</span>
          </button>

          <button
            type="button"
            id="view-toggle-month"
            onClick={() => setViewMode('month')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Month Overview</span>
          </button>
        </div>

        {/* View Info Context Pill */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            {viewMode === 'day'
              ? `Timeline for ${selectedDay} • 8:00 AM – 10:00 PM`
              : viewMode === 'week'
              ? '7-Day Semester Workload Distribution'
              : `Monthly Academic Roadmap (${currentMonthName})`}
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
      {/* 1. DAY VIEW (Expanded Full-Width Hourly Timeline Grid)                    */}
      {/* ========================================================================= */}
      {viewMode === 'day' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Day Tabs (Mon–Sun) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = day === selectedDay;
                const isToday = day === currentDayOfWeekName;
                const count = weeklyPlan.filter((s) => s.day === day).length;
                const lecCount = getDayLectures(day).length;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`flex flex-col items-center justify-center py-2.5 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-2'
                        : isToday
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                      {SHORT_DAYS[day]}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold mt-0.5 hidden sm:inline">
                      {day}
                    </span>

                    {/* Indicators */}
                    <div className="flex items-center gap-1 mt-1">
                      {count > 0 && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-indigo-800 text-indigo-100'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {count} {count === 1 ? 'task' : 'tasks'}
                        </span>
                      )}
                      {lecCount > 0 && (
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                          title={`${lecCount} college classes`}
                        >
                          🏛️ {lecCount}
                        </span>
                      )}
                    </div>

                    {isToday && !isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Navigation & Status Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900">
                    {selectedDay} Schedule
                  </h2>
                  {selectedDay === currentDayOfWeekName && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily Cap: <strong>{dayCapacity} hours</strong> • Planned Study:{' '}
                  <strong className="text-indigo-600">{formatDuration(dayPlannedMinutes)}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>{daySessions.length} Study Blocks</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{dayLectureStats.count} College Classes ({dayLectureStats.hours}h)</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TOP BANNER: SEPARATE FIXED COLLEGE CLASSES                                */}
          {/* ========================================================================= */}
          {selectedDayLectures.length > 0 ? (
            <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/60 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-200/80 text-amber-900">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-amber-950 font-display">
                      Fixed College Classes ({selectedDay})
                    </h3>
                    <p className="text-[11px] text-amber-800/80">
                      Non-editable academic lectures. The timeline below is dedicated for your personal study tasks.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-200/90 text-amber-950 rounded-lg shrink-0">
                  {dayLectureStats.count} {dayLectureStats.count === 1 ? 'Class' : 'Classes'} • {dayLectureStats.hours} Hours
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedDayLectures.map((lec) => {
                  const course = courses.find((c) => c.name === lec.courseName || (lec.courseCode && c.code === lec.courseCode));
                  return (
                    <div
                      key={lec.id}
                      className="bg-white/90 backdrop-blur-xs border border-amber-200/80 rounded-xl p-3.5 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-extrabold text-xs px-2 py-0.5 rounded-md text-white shadow-2xs"
                          style={{ backgroundColor: course?.accentHex || '#f59e0b' }}
                        >
                          {lec.courseName || course?.name || 'College Lecture'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md">
                          {lec.startTime} – {lec.endTime}
                        </span>
                      </div>

                      {lec.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{lec.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700">
                  No fixed college classes on {selectedDay}
                </span>
                <span className="text-slate-400">— Full day availability reserved for personal study tasks.</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* HOURLY TIMELINE GRID (8 AM to 10 PM) WITH EXPANDED FULL-WIDTH LAYOUT      */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Timeline Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="uppercase tracking-wider">Hourly Timeline Grid (8:00 AM – 10:00 PM)</span>
              <span className="text-slate-500 font-normal">
                Full untruncated study task details & interactive controls
              </span>
            </div>

            {/* Timeline Rows */}
            <div className="divide-y divide-slate-100">
              {TIMELINE_HOURS.map((hour) => {
                // Find sessions starting in or belonging to this hour
                const hourSessions = daySessions.filter((s) => {
                  const sessionHour = parseInt((s.timeSlot || '09:00').split(':')[0], 10);
                  return sessionHour === hour;
                });

                const isCurrentHour =
                  selectedDay === currentDayOfWeekName && new Date().getHours() === hour;

                return (
                  <div
                    key={hour}
                    className={`flex flex-col md:flex-row min-h-[72px] transition-colors ${
                      isCurrentHour ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Time Label Column */}
                    <div className="w-full md:w-32 px-4 py-3 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/80 flex items-center justify-between md:justify-start gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-700">
                        <Clock className={`w-3.5 h-3.5 ${isCurrentHour ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{formatHourLabel(hour)}</span>
                      </div>
                      {isCurrentHour && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                          Now
                        </span>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 p-3 sm:p-4 space-y-3">
                      {hourSessions.length > 0 ? (
                        hourSessions.map((session) => {
                          const task = getTask(session.taskId);
                          const course = task ? getCourse(task.courseId) : null;
                          const isCompleted = session.completed || (task && task.status === 'completed');
                          const isAssessment = task?.type === 'Quiz' || task?.type === 'Exam';

                          return (
                            <div
                              key={session.id}
                              className={`p-4 rounded-xl border text-sm transition-all shadow-2xs ${
                                isCompleted
                                  ? 'bg-slate-50 border-slate-200/80 text-slate-500'
                                  : isAssessment
                                  ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                              }`}
                            >
                              {/* Header Meta: Course Tag, Type Badge, Duration */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Course Tag */}
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold text-white shadow-2xs"
                                    style={{
                                      backgroundColor: isCompleted
                                        ? '#94a3b8'
                                        : course?.accentHex || '#4f46e5',
                                    }}
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>{course?.name || 'Course Study'}</span>
                                    {course?.code && (
                                      <span className="opacity-80">({course.code})</span>
                                    )}
                                  </span>

                                  {/* Task Type Badge */}
                                  {task?.type && (
                                    <span
                                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                        isAssessment
                                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {task.type}
                                    </span>
                                  )}

                                  {/* Smart Priority Score */}
                                  {task?.smartPriorityScore !== undefined && (
                                    <span className="text-xs font-semibold text-slate-500">
                                      Priority: {task.smartPriorityScore}/100
                                    </span>
                                  )}
                                </div>

                                {/* Duration & Exact Time Slot */}
                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{formatDuration(session.durationMinutes)}</span>
                                  <span className="text-slate-400">({session.timeSlot})</span>
                                </div>
                              </div>

                              {/* Task Title (UNTRUNCATED full text) */}
                              <div className="pt-3 space-y-1.5">
                                <h3
                                  className={`font-extrabold text-base leading-snug break-words ${
                                    isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                                  }`}
                                >
                                  {task?.name || 'Scheduled study task'}
                                </h3>

                                {/* Notes / Descriptions (UNTRUNCATED full text) */}
                                {task?.notes && (
                                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 break-words whitespace-normal">
                                    {task.notes}
                                  </p>
                                )}
                              </div>

                              {/* Interactive Actions */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => onToggleSessionComplete(session.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isCompleted
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span>{isCompleted ? 'Completed ✓' : 'Mark Task Complete'}</span>
                                </button>

                                {isAssessment && onCheckAssessment && task && (
                                  <button
                                    type="button"
                                    onClick={() => onCheckAssessment(task)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    <Award className="w-4 h-4 text-amber-700" />
                                    <span>Check Exam/Quiz Details</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center py-1.5 text-xs text-slate-400 italic gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-200" />
                          <span>Open focus study slot</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEK VIEW (7-Day Column Grid)                                          */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 animate-in fade-in duration-200">
          {DAYS_OF_WEEK.map((day) => {
            const isToday = day === currentDayOfWeekName;
            const daySessionsList = weeklyPlan.filter((s) => s.day === day);
            const dayHoursAvail = availability.dailyHours[day] ?? 2;
            const dayPlannedMins = daySessionsList.reduce((acc, s) => acc + s.durationMinutes, 0);
            const lecStats = getDayLectureStats(day);

            return (
              <div
                key={day}
                id={`planner-day-${day.toLowerCase()}`}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer ${
                  isToday
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => {
                  setSelectedDay(day);
                  setViewMode('day');
                }}
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
                    <span>{formatDuration(dayPlannedMins)}</span>
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
                  {daySessionsList.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6 text-center text-slate-400 text-xs italic">
                      Rest or open study
                    </div>
                  ) : (
                    daySessionsList.map((session) => {
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

                          {/* Description of what the student has for this task */}
                          {task?.notes && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic leading-tight">
                              {task.notes}
                            </p>
                          )}

                          {/* Actions */}
                          {isAssessment ? (
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
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
      )}

      {/* ========================================================================= */}
      {/* 3. MONTH SUMMARY VIEW                                                      */}
      {/* ========================================================================= */}
      {viewMode === 'month' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
                  {currentMonthName} Academic Pacing (4-Week Roadmap)
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
                  <strong className="text-xs font-bold text-slate-800">Week 1</strong>
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
                  <strong className="text-xs font-bold text-slate-800">Week 2</strong>
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
                  <strong className="text-xs font-bold text-slate-800">Week 3</strong>
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
                  <strong className="text-xs font-bold text-slate-800">Week 4</strong>
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

