import { useState, useMemo } from 'react';
import { PlantedTree, Course, TreeSpecies } from '../types';
import { TreeIllustration } from './TreeIllustration';
import {
  Trees,
  Calendar,
  Clock,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Filter,
  BarChart3,
  TrendingUp,
  Sparkles,
  Info,
  ChevronRight,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { formatDuration } from '../utils/smartPlanner';

interface ForestProps {
  plantedTrees: PlantedTree[];
  courses: Course[];
  onOpenFocusModal: () => void;
}

type Timeframe = 'day' | 'week' | 'month' | 'year';

export function Forest({
  plantedTrees,
  courses,
  onOpenFocusModal,
}: ForestProps) {
  const [activeTab, setActiveTab] = useState<'grove' | 'analysis'>('grove');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<Timeframe>('year');
  const [selectedTree, setSelectedTree] = useState<PlantedTree | null>(null);

  // Overall metrics
  const totalTrees = plantedTrees.length;
  const totalFocusMinutes = plantedTrees.reduce((sum, t) => sum + t.focusMinutes, 0);

  // Filtered grove trees
  const filteredTrees = useMemo(() => {
    return plantedTrees.filter((tree) => {
      const matchCourse =
        selectedCourseFilter === 'all' || tree.courseId === selectedCourseFilter;
      const matchSpecies =
        selectedSpeciesFilter === 'all' || tree.species === selectedSpeciesFilter;
      return matchCourse && matchSpecies;
    });
  }, [plantedTrees, selectedCourseFilter, selectedSpeciesFilter]);

  // Semester weeks data (16-week academic semester model)
  const currentSemesterWeek = 3;
  const semesterWeeks = useMemo(() => {
    const weeks = [];
    for (let w = 1; w <= 16; w++) {
      const treesInWeek = plantedTrees.filter((t) => t.weekNumber === w);
      const minutesInWeek = treesInWeek.reduce((acc, t) => acc + t.focusMinutes, 0);
      const hoursInWeek = Number((minutesInWeek / 60).toFixed(1));
      const isCurrent = w === currentSemesterWeek;
      const isPast = w < currentSemesterWeek;
      const isFuture = w > currentSemesterWeek;
      const isInactive = (isPast || isCurrent) && hoursInWeek === 0;

      weeks.push({
        weekNumber: w,
        treesCount: treesInWeek.length,
        hours: hoursInWeek,
        minutes: minutesInWeek,
        isCurrent,
        isPast,
        isFuture,
        isInactive,
        trees: treesInWeek,
      });
    }
    return weeks;
  }, [plantedTrees, currentSemesterWeek]);

  // Count inactive weeks in the past or current
  const inactiveWeeksList = semesterWeeks.filter((w) => w.isInactive);
  const activeWeeksList = semesterWeeks.filter((w) => (w.isPast || w.isCurrent) && w.hours > 0);

  // Day breakdown (Today's hours)
  const todayTrees = plantedTrees.filter(
    (t) => t.plantedAt.startsWith('2026-09-08') || t.dayOfWeek === 'Tuesday'
  );
  const todayMinutes = todayTrees.reduce((acc, t) => acc + t.focusMinutes, 0);

  // Week breakdown (Monday - Sunday)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  const weekDayData = useMemo(() => {
    return daysOfWeek.map((day) => {
      const treesForDay = plantedTrees.filter((t) => t.weekNumber === 3 && t.dayOfWeek === day);
      const mins = treesForDay.reduce((acc, t) => acc + t.focusMinutes, 0);
      return {
        day,
        hours: Number((mins / 60).toFixed(1)),
        treesCount: treesForDay.length,
        isToday: day === 'Tuesday',
      };
    });
  }, [plantedTrees]);

  // Month breakdown (Weeks of September 2026)
  const monthWeeks = [
    { label: 'Week 1 (Aug 31 - Sep 6)', weekNum: 2, hours: 4.2, trees: 5, inactive: false },
    { label: 'Week 2 (Sep 7 - Sep 13 - Current)', weekNum: 3, hours: 2.8, trees: 4, inactive: false },
    { label: 'Week 3 (Sep 14 - Sep 20)', weekNum: 4, hours: 0, trees: 0, inactive: false, upcoming: true },
    { label: 'Week 4 (Sep 21 - Sep 27)', weekNum: 5, hours: 0, trees: 0, inactive: false, upcoming: true },
  ];

  return (
    <div id="forest-page" className="space-y-8 pb-20 max-w-7xl animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-1.5">
            <Trees className="w-3.5 h-3.5 text-emerald-600" />
            <span>Academic Focus Forest</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Planted Forest & Activity
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Explore your planted trees and analyze your academic study activity across the semester.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5">
          <button
            id="forest-plant-tree-btn"
            onClick={onOpenFocusModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Grow Tree with 30m Focus</span>
          </button>
        </div>
      </div>

      {/* Top Forest Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trees Grown
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trees className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {totalTrees} <span className="text-xs font-normal text-slate-400">trees</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">100% bloomed from focus</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Focus Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {formatDuration(totalFocusMinutes)}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Across 5 academic courses</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Weeks
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {activeWeeksList.length}{' '}
            <span className="text-xs font-normal text-slate-400">of {currentSemesterWeek} weeks</span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-1">Current streak: Week 2 & 3</p>
        </div>

        <div
          className={`p-5 rounded-2xl border shadow-xs transition-colors ${
            inactiveWeeksList.length > 0
              ? 'bg-rose-50/50 border-rose-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inactive Weeks
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                inactiveWeeksList.length > 0
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold font-display ${
              inactiveWeeksList.length > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {inactiveWeeksList.length}{' '}
            <span className="text-xs font-normal text-slate-500">detected</span>
          </div>
          <p className="text-xs text-rose-600 font-medium mt-1">
            {inactiveWeeksList.length > 0
              ? `Week ${inactiveWeeksList.map((w) => w.weekNumber).join(', ')} had 0h`
              : 'No inactive gaps! Great job.'}
          </p>
        </div>
      </div>

      {/* Main Tab Switcher: Forest Grove (Planted Trees) vs Activity Analysis */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            id="forest-tab-grove"
            type="button"
            onClick={() => setActiveTab('grove')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'grove'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trees className="w-4 h-4 text-emerald-500" />
            <span>Planted Trees ({totalTrees})</span>
          </button>

          <button
            id="forest-tab-analysis"
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'analysis'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Analysis of Activity</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FOREST GROVE (PLANTED TREES)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'grove' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
                Course:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCourseFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  selectedCourseFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Courses
              </button>
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourseFilter(course.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    selectedCourseFilter === course.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: course.accentHex }}
                  />
                  <span>{course.name}</span>
                </button>
              ))}
            </div>

            <div className="text-slate-500 font-medium">
              Showing {filteredTrees.length} of {totalTrees} planted trees
            </div>
          </div>

          {/* Planted Trees Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredTrees.map((tree) => {
              const course = courses.find((c) => c.id === tree.courseId);

              return (
                <div
                  key={tree.id}
                  id={`tree-card-${tree.id}`}
                  onClick={() => setSelectedTree(tree)}
                  className="group relative p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 shadow-2xs hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 rounded-xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors">
                    <TreeIllustration
                      progressPercent={100}
                      species={tree.species}
                      size="md"
                    />
                  </div>

                  <h4 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-full">
                    {tree.species}
                  </h4>

                  <span
                    className="text-[10px] font-semibold mt-0.5 truncate max-w-full"
                    style={{ color: course?.accentHex || tree.courseColor }}
                  >
                    {tree.courseName}
                  </span>

                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    {tree.focusMinutes}m • {tree.dayOfWeek.slice(0, 3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVITY ANALYSIS (DAY / WEEK / MONTH / YEAR)                     */}
      {/* ========================================================================= */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Timeframe Switcher */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-2">
              Timeframe:
            </span>
            <div className="flex items-center gap-1.5">
              {(['day', 'week', 'month', 'year'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    timeframe === tf
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 1. YEAR / SEMESTER VIEW (WITH INACTIVE WEEKS DETECTOR)                 */}
          {/* ===================================================================== */}
          {timeframe === 'year' && (
            <div className="space-y-6">
              {/* Inactive Week Notification Banner */}
              {inactiveWeeksList.length > 0 ? (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      Inactive Weeks Detected ({inactiveWeeksList.length} Week{inactiveWeeksList.length > 1 ? 's' : ''})
                    </h3>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      You logged 0 focus minutes during{' '}
                      <strong>
                        {inactiveWeeksList.map((w) => `Week ${w.weekNumber}`).join(', ')}
                      </strong>.
                      Consistency across the semester is essential to avoid compounding exam cramming fatigue.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">No Inactive Weeks Detected</h3>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      Your semester focus is unbroken. Maintaining steady weekly study blocks prevents stress during finals.
                    </p>
                  </div>
                </div>
              )}

              {/* 16-Week Semester Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-display text-slate-900">
                    16-Week Academic Semester Focus Matrix
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Current: Week {currentSemesterWeek}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {semesterWeeks.map((week) => (
                    <div
                      key={week.weekNumber}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                        week.isCurrent
                          ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : week.isInactive
                          ? 'border-rose-200 bg-rose-50/60'
                          : week.hours > 0
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-slate-600">
                        W{week.weekNumber}
                      </span>
                      <div className="my-2">
                        {week.isInactive ? (
                          <span className="text-xs font-bold text-rose-600">0h</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {week.hours}h
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {week.treesCount} 🌲
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 2. MONTH VIEW                                                         */}
          {/* ===================================================================== */}
          {timeframe === 'month' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  September 2026 Focus Pacing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed distribution of study hours across September weeks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {monthWeeks.map((mw) => (
                  <div
                    key={mw.label}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <span className="text-xs font-bold text-slate-800 block">{mw.label}</span>
                    <div className="text-2xl font-extrabold text-slate-900 font-display">
                      {mw.hours}h
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {mw.trees > 0 ? `${mw.trees} trees bloomed` : 'Upcoming session'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 3. WEEK VIEW                                                          */}
          {/* ===================================================================== */}
          {timeframe === 'week' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Current Week Breakdown (Week 3)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily focus distribution Monday through Sunday.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                {weekDayData.map((d) => (
                  <div
                    key={d.day}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center ${
                      d.isToday
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                        : d.hours === 0
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-700">{d.day.slice(0, 3)}</span>
                    <span className="text-lg my-2 font-mono font-bold text-slate-900">{d.hours}h</span>
                    <span className="text-[10px] text-slate-500">
                      {d.treesCount > 0 ? `${d.treesCount} 🌲` : '0 trees'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 4. DAY VIEW                                                           */}
          {/* ===================================================================== */}
          {timeframe === 'day' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">
                  Today's Focus Timeline (Tuesday, Sep 8)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total focus today: <strong>{formatDuration(todayMinutes)}</strong> across {todayTrees.length} sessions.
                </p>
              </div>

              <div className="space-y-3">
                {todayTrees.map((tree) => (
                  <div
                    key={tree.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        🌲
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{tree.taskName}</h4>
                        <span className="text-[11px] text-slate-500">
                          {tree.courseName} • {tree.species}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-600 block">
                        {tree.focusMinutes} min focus
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tree.plantedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tree Details Modal */}
      {selectedTree && (
        <div
          onClick={() => setSelectedTree(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4"
          >
            <div className="w-24 h-24 mx-auto flex items-center justify-center p-3 rounded-2xl bg-slate-50">
              <TreeIllustration progressPercent={100} species={selectedTree.species} size="lg" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                {selectedTree.species}
              </h3>
              <p className="text-xs text-indigo-600 font-semibold">{selectedTree.courseName}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <p><strong>Task:</strong> {selectedTree.taskName}</p>
              <p><strong>Focus Duration:</strong> {selectedTree.focusMinutes} minutes</p>
              <p><strong>Planted:</strong> {new Date(selectedTree.plantedAt).toLocaleDateString()}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTree(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
