import React, { useState } from 'react';
import { Course, Task } from '../types';
import {
  calculateSemesterGradeProjection,
  percentageToLetterGrade,
  getTaskWeight,
} from '../utils/gradeProjection';
import {
  Target,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sliders,
  RotateCcw,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Edit2,
  Check,
} from 'lucide-react';
import { formatDeadlineRelative } from '../utils/smartPlanner';

interface GradeProjectionViewProps {
  tasks: Task[];
  courses: Course[];
  onOpenScorePrompt?: (task: Task) => void;
  onUpdateTaskGrade?: (taskId: string, achievedGrade: number, maxGrade?: number, weightPercentage?: number) => void;
}

export function GradeProjectionView({
  tasks,
  courses,
  onOpenScorePrompt,
  onUpdateTaskGrade,
}: GradeProjectionViewProps) {
  const [targetGpa, setTargetGpa] = useState<number>(3.8);
  const [simulatedScores, setSimulatedScores] = useState<Record<string, number>>({});
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [editingScoreTaskId, setEditingScoreTaskId] = useState<string | null>(null);
  const [tempAchievedScore, setTempAchievedScore] = useState<string>('');
  const [tempMaxScore, setTempMaxScore] = useState<string>('100');
  const [tempWeightPct, setTempWeightPct] = useState<string>('20');

  // Compute grade projection metrics
  const projection = calculateSemesterGradeProjection(courses, tasks, targetGpa, simulatedScores);

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const handleSimulatedScoreChange = (taskId: string, scorePct: number) => {
    setSimulatedScores((prev) => ({
      ...prev,
      [taskId]: scorePct,
    }));
  };

  const handleResetSimulations = () => {
    setSimulatedScores({});
  };

  const handleSetAllBestCase = () => {
    const bestCase: Record<string, number> = {};
    tasks.forEach((t) => {
      if (typeof t.achievedGrade !== 'number' || t.achievedGrade < 0) {
        bestCase[t.id] = 100;
      }
    });
    setSimulatedScores(bestCase);
  };

  const handleStartEditingScore = (task: Task) => {
    setEditingScoreTaskId(task.id);
    setTempAchievedScore(task.achievedGrade !== undefined ? String(task.achievedGrade) : '');
    setTempMaxScore(task.maxGrade !== undefined ? String(task.maxGrade) : '100');
    setTempWeightPct(String(getTaskWeight(task)));
  };

  const handleSaveInlineScore = (taskId: string) => {
    const achieved = parseFloat(tempAchievedScore);
    const maxVal = parseFloat(tempMaxScore) || 100;
    const weightVal = parseFloat(tempWeightPct) || 15;

    if (!isNaN(achieved) && onUpdateTaskGrade) {
      onUpdateTaskGrade(taskId, achieved, maxVal, weightVal);
    }
    setEditingScoreTaskId(null);
  };

  const targetPresetGpas = [3.0, 3.3, 3.5, 3.7, 3.8, 4.0];

  return (
    <div id="grade-projection-container" className="space-y-8 animate-in fade-in duration-200">
      {/* Target GPA Selector Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>GPA Goal Targeter</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Target Semester GPA Calculator
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Set your target semester GPA to automatically calculate the minimum required percentage scores on all future exams, quizzes, and projects.
            </p>
          </div>

          {/* Big Target GPA Pill */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex items-center gap-4 shrink-0 self-start md:self-auto shadow-inner">
            <div className="p-3.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
              <Award className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 block">
                Target GPA
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-display text-white">
                  {targetGpa.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                  ~{projection.targetSemesterPct}% ({percentageToLetterGrade(projection.targetSemesterPct)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GPA Controls & Slider */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Target GPA:</span>
            </span>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              {targetPresetGpas.map((gpa) => {
                const isSelected = targetGpa === gpa;
                return (
                  <button
                    key={gpa}
                    type="button"
                    onClick={() => setTargetGpa(gpa)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {gpa.toFixed(2)} GPA
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider input */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-slate-400">2.00</span>
            <input
              type="range"
              min="2.00"
              max="4.00"
              step="0.05"
              value={targetGpa}
              onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-xs font-mono font-bold text-amber-400">4.00</span>
          </div>
        </div>
      </div>

      {/* Semester Standing Overview Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Estimated GPA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Graded GPA
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
              {projection.currentEstimatedGpa !== null ? projection.currentEstimatedGpa.toFixed(2) : 'N/A'}
            </span>
            {projection.currentEstimatedGpa !== null && (
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                {percentageToLetterGrade(projection.currentEstimatedGpa >= 3.7 ? 90 : projection.currentEstimatedGpa >= 3.0 ? 80 : 70)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Based on completed graded assessments
          </p>
        </div>

        {/* Card 2: Projected GPA with Simulations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Projected Semester GPA
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-amber-600 dark:text-amber-400">
              {projection.projectedGpa !== null ? projection.projectedGpa.toFixed(2) : 'N/A'}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              / 4.00
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Includes required & simulated exam scores
          </p>
        </div>

        {/* Card 3: Upcoming Future Exams Count */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Future Assessments
            </span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            {projection.upcomingExamsCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Exams, quizzes & projects remaining
          </p>
        </div>

        {/* Card 4: Overall Target Feasibility */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Goal Feasibility
            </span>
            {projection.overallFeasibility === 'secured' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : projection.overallFeasibility === 'achievable' ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            ) : projection.overallFeasibility === 'stretch' ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {projection.overallFeasibility === 'secured' && (
              <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-sm font-extrabold border border-emerald-300">
                🎉 Target Secured!
              </span>
            )}
            {projection.overallFeasibility === 'achievable' && (
              <span className="px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 text-sm font-extrabold border border-indigo-300">
                🟢 On Track
              </span>
            )}
            {projection.overallFeasibility === 'stretch' && (
              <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-sm font-extrabold border border-amber-300">
                🟡 High Effort Needed
              </span>
            )}
            {projection.overallFeasibility === 'unattainable' && (
              <span className="px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 text-sm font-extrabold border border-rose-300">
                🔴 Adjust Target
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {projection.overallFeasibility === 'secured'
              ? 'Target GPA is already locked in!'
              : projection.overallFeasibility === 'achievable'
              ? 'Target GPA achievable with realistic exam scores.'
              : projection.overallFeasibility === 'stretch'
              ? 'Requires near-perfect scores or extra credit.'
              : 'Target exceeds remaining available grade points.'}
          </p>
        </div>
      </div>

      {/* Interactive Simulation Controls Toolbar */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Interactive Exam Score Simulator</span>
          {Object.keys(simulatedScores).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold font-mono">
              {Object.keys(simulatedScores).length} Simulated
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleSetAllBestCase}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            Simulate 100% Best Case
          </button>
          <button
            type="button"
            onClick={handleResetSimulations}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to Min Required</span>
          </button>
        </div>
      </div>

      {/* Per-Course Grade Projection Breakdown Cards */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Course Required Exam Scores Breakdown</span>
        </h3>

        {projection.courseProjections.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            No active courses enrolled. Add courses in the Courses tab to project exam targets!
          </div>
        ) : (
          projection.courseProjections.map((cp) => {
            const isExpanded = expandedCourses[cp.course.id] ?? true;
            return (
              <div
                key={cp.course.id}
                id={`course-projection-card-${cp.course.id}`}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Course Header */}
                <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: cp.course.accentHex || '#4f46e5' }}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold font-display text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                          {cp.course.name}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                          {cp.course.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                          {cp.credits} Credits
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        Instructor: {cp.course.professor || 'Department Faculty'}
                      </p>
                    </div>
                  </div>

                  {/* Course Standing Badges */}
                  <div className="flex items-center gap-3 self-end sm:self-center flex-wrap">
                    {/* Current Course Average */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Current Avg
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {cp.currentAveragePct !== null ? `${cp.currentAveragePct}%` : 'No grades yet'}
                        </span>
                        {cp.currentAveragePct !== null && (
                          <span className="text-xs font-bold text-slate-500">
                            ({percentageToLetterGrade(cp.currentAveragePct)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Required Score Badge */}
                    <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 block tracking-wider">
                        Required Score
                      </span>
                      {cp.requiredRemainingPct === null ? (
                        <span className="text-xs font-bold text-slate-400">All Graded</span>
                      ) : (
                        <span
                          className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg border ${
                            cp.feasibilityStatus === 'secured'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : cp.feasibilityStatus === 'achievable'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200'
                              : cp.feasibilityStatus === 'stretch'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {cp.requiredRemainingPct}% avg
                        </span>
                      )}
                    </div>

                    {/* Expand/Collapse toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCourseExpand(cp.course.id)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer ml-1"
                      title={isExpanded ? 'Collapse course details' : 'Expand course details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Course Body */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Weight Breakdown Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Course Evaluation Weight Distribution</span>
                        <span className="font-mono">
                          {cp.totalGradedWeight}% Graded • {cp.remainingWeight}% Remaining
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${cp.totalGradedWeight}%` }}
                          title={`Completed Graded Weight: ${cp.totalGradedWeight}%`}
                        />
                        <div
                          className="h-full bg-indigo-500/40 transition-all duration-300"
                          style={{ width: `${cp.remainingWeight}%` }}
                          title={`Remaining Future Weight: ${cp.remainingWeight}%`}
                        />
                      </div>
                    </div>

                    {/* TWO COLUMNS: Graded Assessments & Future Upcoming Exams */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Column A: Graded Assessments */}
                      <div className="space-y-3 bg-slate-50/80 dark:bg-slate-950/30 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Graded Assessments ({cp.gradedTasks.length})</span>
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            Earned: {cp.earnedWeight} pts
                          </span>
                        </div>

                        {cp.gradedTasks.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-3 text-center">
                            No scored tasks recorded yet for this course.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {cp.gradedTasks.map((t) => {
                              const maxG = t.maxGrade || 100;
                              const weight = getTaskWeight(t);
                              const pct = Math.round((((t.achievedGrade ?? 0) / maxG) * 100) * 10) / 10;
                              const isEditing = editingScoreTaskId === t.id;

                              return (
                                <div
                                  key={t.id}
                                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-2xs"
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {t.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                      Type: {t.type} • Weight: {weight}%
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {isEditing ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={tempAchievedScore}
                                          onChange={(e) => setTempAchievedScore(e.target.value)}
                                          className="w-14 px-2 py-1 rounded-md border border-indigo-400 text-xs font-mono font-bold bg-white text-slate-900"
                                          placeholder="Score"
                                        />
                                        <span className="text-slate-400 font-mono">/</span>
                                        <input
                                          type="number"
                                          value={tempMaxScore}
                                          onChange={(e) => setTempMaxScore(e.target.value)}
                                          className="w-14 px-2 py-1 rounded-md border border-slate-300 text-xs font-mono bg-white text-slate-900"
                                          placeholder="Max"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveInlineScore(t.id)}
                                          className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="text-right font-mono font-extrabold text-slate-900 dark:text-white">
                                          {t.achievedGrade} / {maxG}{' '}
                                          <span className="text-[11px] text-emerald-600 font-bold ml-1">
                                            ({pct}%)
                                          </span>
                                        </div>
                                        {onUpdateTaskGrade && (
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditingScore(t)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                            title="Edit score"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Column B: Future / Ungraded Exams & Required Scores */}
                      <div className="space-y-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-200/80 dark:border-indigo-900/40">
                        <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60 dark:border-indigo-900/40">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Future Exams & Assessments ({cp.ungradedTasks.length})</span>
                          </span>
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                            Target Req: {cp.requiredRemainingPct !== null ? `${cp.requiredRemainingPct}%` : 'N/A'}
                          </span>
                        </div>

                        {cp.ungradedTasks.length === 0 ? (
                          <div className="p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl text-center text-xs text-slate-500">
                            All course tasks have completed grades recorded! 🎉
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {cp.ungradedTasks.map((t) => {
                              const weight = getTaskWeight(t);
                              const maxG = t.maxGrade || 100;
                              const reqPct = cp.requiredRemainingPct !== null ? cp.requiredRemainingPct : 85;
                              const reqPts = Math.round(((reqPct / 100) * maxG) * 10) / 10;
                              const currentSimScore = simulatedScores[t.id] ?? reqPct;
                              const relativeDate = formatDeadlineRelative(t.deadline);

                              return (
                                <div
                                  key={t.id}
                                  id={`future-task-card-${t.id}`}
                                  className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200/80 dark:border-slate-800 shadow-2xs space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                          {t.name}
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold">
                                          {t.type}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                          Due: {relativeDate.text}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium">
                                        Weight: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{weight}% of course</span>
                                      </div>
                                    </div>

                                    {/* Calculated Required Minimum Score */}
                                    <div className="text-right shrink-0">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Target Needed
                                      </span>
                                      <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                                        {reqPct > 100 ? '100%+' : `${reqPct}%`} ({reqPts}/{maxG} pts)
                                      </span>
                                    </div>
                                  </div>

                                  {/* Score Simulator Slider */}
                                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                      <span>Simulate Score:</span>
                                      <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                                        {currentSimScore}% ({Math.round(((currentSimScore / 100) * maxG) * 10) / 10} / {maxG} pts)
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={currentSimScore}
                                      onChange={(e) =>
                                        handleSimulatedScoreChange(t.id, parseFloat(e.target.value))
                                      }
                                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex items-center justify-between gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSimulatedScoreChange(t.id, Math.min(100, reqPct))}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                      >
                                        Set Required Min ({reqPct}%)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSimulatedScoreChange(t.id, 100)}
                                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                                      >
                                        Set 100%
                                      </button>
                                    </div>
                                  </div>

                                  {/* Record Actual Achieved Grade Button */}
                                  {onOpenScorePrompt && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenScorePrompt(t)}
                                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" />
                                      <span>Record Exam Score</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
