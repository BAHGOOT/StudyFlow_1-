import { useState, useMemo } from 'react';
import { Task, Course, TaskType } from '../types';
import {
  Search,
  Plus,
  Play,
  Check,
  Clock,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  AlertCircle,
  Maximize2,
  Timer,
  Award,
  BookOpen,
  Target,
  CheckSquare,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { formatDeadlineRelative, formatDuration, isTaskAtRisk } from '../utils/smartPlanner';

interface MyTasksProps {
  tasks: Task[];
  courses: Course[];
  onStartTask: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onBulkCompleteTasks?: (taskIds: string[]) => void;
  onBulkDeleteTasks?: (taskIds: string[]) => void;
  onOpenAddTask: () => void;
  activeTaskId?: string;
  onExpandSession?: () => void;
  onOpenScorePrompt?: (task: Task) => void;
}

type FilterOption = 'All' | 'At Risk' | 'Today' | 'Upcoming' | 'Overdue' | 'Completed';
type SortOption = 'Priority' | 'Deadline' | 'Course' | 'Estimated time';
type GroupingOption = 'none' | 'course' | 'dueDate';

/**
 * Simplifies auto-generated task titles by removing repetitive verbose suffixes.
 */
export function simplifyTaskTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/:\s*Core Concepts & Lecture Synthesis/i, ' - Core Concepts')
    .replace(/:\s*Deep Problem Practice & Application/i, ' - Practice Problems')
    .replace(/\(Stage 1:\s*Concept Review & Synthesis\)/i, '- Concept Review')
    .replace(/\(Stage 2:\s*Practice Problems & Application\)/i, '- Practice Problems')
    .replace(/\(Stage 3:\s*Past Exams & Mock Review\)/i, '- Past Exams')
    .replace(/:\s*Lecture Synthesis & Flashcard Review/i, ' - Synthesis')
    .replace(/:\s*Problem Solving & Active Recall/i, ' - Active Recall');
}

export function getSmartPriorityLevel(score: number): {
  level: 'Low' | 'Medium' | 'High';
  badgeClass: string;
  dotClass: string;
  stripClass: string;
} {
  if (score >= 70) {
    return {
      level: 'High',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90 font-bold',
      dotClass: 'bg-rose-500',
      stripClass: 'bg-rose-500',
    };
  }
  if (score >= 40) {
    return {
      level: 'Medium',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/90 font-bold',
      dotClass: 'bg-amber-500',
      stripClass: 'bg-amber-400',
    };
  }
  return {
    level: 'Low',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 font-bold',
    dotClass: 'bg-emerald-500',
    stripClass: 'bg-emerald-400',
  };
}

export function MyTasks({
  tasks,
  courses,
  onStartTask,
  onToggleComplete,
  onDeleteTask,
  onBulkCompleteTasks,
  onBulkDeleteTasks,
  onOpenAddTask,
  activeTaskId,
  onExpandSession,
  onOpenScorePrompt,
}: MyTasksProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [activeSort, setActiveSort] = useState<SortOption>('Priority');
  const [groupingMode, setGroupingMode] = useState<GroupingOption>('none');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleToggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredTasks.map((t) => t.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(Array.from(new Set([...selectedTaskIds, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkComplete = () => {
    if (selectedTaskIds.length === 0) return;
    if (onBulkCompleteTasks) {
      onBulkCompleteTasks(selectedTaskIds);
    } else {
      selectedTaskIds.forEach((id) => onToggleComplete(id));
    }
    setSelectedTaskIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    if (onBulkDeleteTasks) {
      onBulkDeleteTasks(selectedTaskIds);
    } else {
      selectedTaskIds.forEach((id) => onDeleteTask(id));
    }
    setSelectedTaskIds([]);
    setIsSelectionMode(false);
  };

  const getCourse = (courseId: string) => courses.find((c) => c.id === courseId);

  // Filter and Sort logic
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const course = getCourse(task.courseId);
          const matchName = (task.name || '').toLowerCase().includes(q);
          const matchCourse = (course?.name || '').toLowerCase().includes(q) || (course?.code || '').toLowerCase().includes(q);
          const matchType = (task.type || '').toLowerCase().includes(q);
          if (!matchName && !matchCourse && !matchType) return false;
        }

        // Filter tab
        const relative = formatDeadlineRelative(task.deadline);
        if (activeFilter === 'Completed') {
          return task.status === 'completed';
        }
        if (activeFilter === 'At Risk') {
          return isTaskAtRisk(task);
        }
        if (activeFilter === 'Today') {
          return task.status !== 'completed' && relative.text === 'Today';
        }
        if (activeFilter === 'Overdue') {
          return task.status !== 'completed' && relative.text === 'Overdue';
        }
        if (activeFilter === 'Upcoming') {
          return task.status !== 'completed' && relative.text !== 'Overdue';
        }
        // 'All' shows all
        return true;
      })
      .sort((a, b) => {
        if (activeSort === 'Priority') {
          return b.smartPriorityScore - a.smartPriorityScore;
        }
        if (activeSort === 'Deadline') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (activeSort === 'Course') {
          const courseA = getCourse(a.courseId)?.name || '';
          const courseB = getCourse(b.courseId)?.name || '';
          return courseA.localeCompare(courseB);
        }
        if (activeSort === 'Estimated time') {
          return b.estimatedMinutes - a.estimatedMinutes;
        }
        return 0;
      });
  }, [tasks, searchQuery, activeFilter, activeSort, courses]);

  const filterCounts = useMemo(() => {
    return {
      All: tasks.length,
      'At Risk': tasks.filter((t) => isTaskAtRisk(t)).length,
      Today: tasks.filter((t) => t.status !== 'completed' && formatDeadlineRelative(t.deadline).text === 'Today').length,
      Upcoming: tasks.filter((t) => t.status !== 'completed' && formatDeadlineRelative(t.deadline).text !== 'Overdue').length,
      Overdue: tasks.filter((t) => t.status !== 'completed' && formatDeadlineRelative(t.deadline).text === 'Overdue').length,
      Completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  // Summary metrics for pending workload
  const workloadSummary = useMemo(() => {
    const pendingTasks = tasks.filter((t) => t.status !== 'completed');
    const totalPendingMinutes = pendingTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    const totalHours = Math.round((totalPendingMinutes / 60) * 10) / 10;
    const avgMinutes = pendingTasks.length > 0 ? Math.round(totalPendingMinutes / pendingTasks.length) : 0;
    const avgHours = Math.round((avgMinutes / 60) * 10) / 10;

    return {
      pendingCount: pendingTasks.length,
      totalMinutes: totalPendingMinutes,
      totalHours,
      formattedTotalTime: formatDuration(totalPendingMinutes),
      avgMinutes,
      avgHours,
      formattedAvgTime: formatDuration(avgMinutes),
    };
  }, [tasks]);

  const renderTaskCard = (task: Task) => {
    const course = getCourse(task.courseId);
    const isCompleted = task.status === 'completed';
    const relative = formatDeadlineRelative(task.deadline);
    const priority = getSmartPriorityLevel(task.smartPriorityScore);
    const isTaskSelected = selectedTaskIds.includes(task.id);
    const atRisk = isTaskAtRisk(task);

    return (
      <div
        key={task.id}
        id={`task-card-${task.id}`}
        onClick={(e) => {
          if (isSelectionMode) {
            const targetEl = e.target as HTMLElement;
            if (!targetEl.closest('button')) {
              handleToggleSelectTask(task.id);
            }
          }
        }}
        className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
          isSelectionMode ? 'cursor-pointer' : ''
        } ${
          isTaskSelected
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30'
            : isCompleted
            ? 'border-slate-200 bg-slate-50/60 opacity-75'
            : atRisk
            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400 hover:shadow-xs ring-1 ring-rose-300/40'
            : 'border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-xs'
        }`}
      >
        {/* Color-coded priority edge indicator strip */}
        <div
          className={`absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-md transition-colors ${
            isTaskSelected
              ? 'bg-indigo-600'
              : isCompleted
              ? 'bg-slate-300'
              : atRisk
              ? 'bg-rose-600 animate-pulse'
              : priority.stripClass
          }`}
          title={atRisk ? 'AT RISK: Due in < 48 hours & Not Started' : `Priority: ${priority.level} (${task.smartPriorityScore}/99)`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pl-1.5">
          {/* Left: Checkboxes + Info */}
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Selection Checkbox (Visible in selection mode) */}
            {isSelectionMode && (
              <button
                type="button"
                id={`task-select-checkbox-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSelectTask(task.id);
                }}
                className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  isTaskSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : 'border-slate-300 hover:border-indigo-400 bg-white'
                }`}
                aria-label="Select task"
                title="Select task"
              >
                {isTaskSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            )}

            {/* Standard Completion Checkbox */}
            <button
              type="button"
              id={`task-check-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isSelectionMode) {
                  handleToggleSelectTask(task.id);
                } else {
                  onToggleComplete(task.id);
                }
              }}
              className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-indigo-500 bg-white'
              }`}
              aria-label="Toggle completed"
              title={isSelectionMode ? 'Click to select task' : 'Toggle completed'}
            >
              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            {/* Details */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Course Badge */}
                {course && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider"
                    style={{ backgroundColor: course.accentHex }}
                  >
                    {course.name}
                  </span>
                )}

                {/* Task Type */}
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                  {task.type}
                </span>

                {/* At Risk Alert Badge */}
                {atRisk && (
                  <span
                    id={`task-at-risk-badge-${task.id}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-2xs animate-pulse"
                    title="At Risk: Due within 48 hours and has not been started yet!"
                  >
                    <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                    <span>⚠️ AT RISK (&lt; 48h)</span>
                  </span>
                )}

                {/* Unified Merged Priority Level & Score Badge */}
                <span
                  id={`task-priority-indicator-${task.id}`}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition-colors ${priority.badgeClass}`}
                  title={`Smart Priority: ${priority.level} (Score: ${task.smartPriorityScore}/99)`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${priority.dotClass}`} />
                  <span>P{task.smartPriorityScore} {priority.level}</span>
                </span>

                {/* In Progress Status Badge */}
                {(task.status === 'in_progress' || activeTaskId === task.id) && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span>In Progress</span>
                  </span>
                )}

                {/* Remedial Task Badge */}
                {task.isRemedial && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>🎯 Remedial Review</span>
                  </span>
                )}

                {/* Achieved Score Badge */}
                {typeof task.achievedGrade === 'number' && (
                  <button
                    type="button"
                    onClick={() => onOpenScorePrompt && onOpenScorePrompt(task)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition-colors cursor-pointer ${
                      (task.achievedGrade / (task.maxGrade || 100)) >= 0.8
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                    }`}
                    title="Click to view/edit assessment score"
                  >
                    <Award className="w-3 h-3" />
                    <span>
                      Score: {task.achievedGrade}/{task.maxGrade || 100} ({Math.round((task.achievedGrade / (task.maxGrade || 100)) * 100)}%)
                      {(task.achievedGrade / (task.maxGrade || 100)) >= 0.8 ? ' • Mastered' : ' • Remedial'}
                    </span>
                  </button>
                )}
              </div>

              {/* Simplified Title */}
              <h3
                className={`text-sm sm:text-base font-bold ${
                  isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                }`}
              >
                {simplifyTaskTitle(task.name)}
              </h3>

              {/* Syllabus Grounding Session Details */}
              {(task.exactReading || task.exerciseTarget || task.targetOutcome) && !task.isRemedial && (
                <div className="py-2 px-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 flex flex-col gap-1 my-1">
                  {task.exactReading && (
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-200">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{task.exactReading}</span>
                    </div>
                  )}
                  {task.exerciseTarget && (
                    <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                      <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{task.exerciseTarget}</span>
                    </div>
                  )}
                  {task.targetOutcome && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{task.targetOutcome}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Remedial Objective Banner */}
              {task.isRemedial && (
                <div className="py-1.5 px-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5 my-1">
                  <span className="font-extrabold text-amber-800 shrink-0">Objective:</span>
                  <span className="leading-snug">
                    {task.targetOutcome || `Remedial Review: Focus on weaker topics from ${task.remedialSourceExamName || 'assessment'} to boost course grade.`}
                  </span>
                </div>
              )}

              {task.notes && (
                <p className="text-xs text-slate-500 line-clamp-1">{task.notes}</p>
              )}

              {/* Meta stats: Deadline & Duration */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due:</span>
                  <span
                    className={`font-semibold ${
                      relative.urgency === 'critical'
                        ? 'text-rose-600 font-bold'
                        : relative.urgency === 'high'
                        ? 'text-amber-600 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    {relative.text}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDuration(task.estimatedMinutes)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Compact Sleek Action Controls */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {!isCompleted && (
              activeTaskId === task.id ? (
                <button
                  type="button"
                  id={`view-in-progress-btn-${task.id}`}
                  onClick={onExpandSession}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer ring-2 ring-amber-300 animate-pulse flex items-center gap-1.5"
                  title="View active focus session timer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Focusing</span>
                </button>
              ) : activeTaskId ? (
                <button
                  type="button"
                  id={`disabled-start-btn-${task.id}`}
                  disabled
                  title="Another focus session is active"
                  className="p-2 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  id={`start-task-btn-${task.id}`}
                  onClick={() => onStartTask(task)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  title="Start Focus Session"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{task.status === 'in_progress' ? 'Resume' : 'Start'}</span>
                </button>
              )
            )}

            {/* Assessment Score Action Button */}
            {(task.type === 'Exam' || task.type === 'Quiz' || typeof task.maxGrade === 'number') && (
              <button
                type="button"
                id={`record-score-btn-${task.id}`}
                onClick={() => onOpenScorePrompt && onOpenScorePrompt(task)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeof task.achievedGrade === 'number'
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    : isCompleted
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs animate-pulse'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
                title={typeof task.achievedGrade === 'number' ? 'Edit assessment score' : 'Enter assessment score'}
              >
                <Award className="w-3.5 h-3.5 text-current" />
                <span>{typeof task.achievedGrade === 'number' ? 'Score' : 'Enter Score'}</span>
              </button>
            )}

            <button
              type="button"
              id={`delete-task-btn-${task.id}`}
              onClick={() => onDeleteTask(task.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="my-tasks-page" className="space-y-6 pb-20">
      {/* Top Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            My Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Smart academic task workload prioritized by deadline, difficulty, and study capacity.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            id="toggle-selection-mode-btn"
            type="button"
            onClick={() => {
              setIsSelectionMode((prev) => !prev);
              if (isSelectionMode) setSelectedTaskIds([]);
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
              isSelectionMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isSelectionMode ? 'Exit Selection' : 'Selection Mode'}</span>
            {selectedTaskIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-indigo-900 text-[10px] font-extrabold font-mono">
                {selectedTaskIds.length}
              </span>
            )}
          </button>

          <button
            id="add-task-header-btn"
            onClick={onOpenAddTask}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Workload Summary Card */}
      <div
        id="tasks-workload-summary-card"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workload Summary</h2>
              <p className="text-xs text-slate-500">
                Total estimated commitment across all pending academic tasks
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 self-start sm:self-auto font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {workloadSummary.pendingCount} pending {workloadSummary.pendingCount === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
          {/* Total Hours Remaining */}
          <div
            id="summary-total-hours-remaining"
            className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Total Hours Remaining</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-display text-slate-900 tracking-tight">
                  {workloadSummary.totalHours}
                </span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">hrs</span>
                <span className="text-xs text-slate-400 font-mono ml-1">
                  ({workloadSummary.formattedTotalTime})
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-indigo-600 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Average Estimated Time per Task */}
          <div
            id="summary-avg-time-per-task"
            className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Average Time Per Task</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-display text-slate-900 tracking-tight">
                  {workloadSummary.formattedAvgTime}
                </span>
                {workloadSummary.avgMinutes > 0 && (
                  <span className="text-xs text-slate-400 font-mono ml-1">
                    (~{workloadSummary.avgHours}h)
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-amber-600 shadow-2xs">
              <Timer className="w-4 h-4" />
            </div>
          </div>

          {/* Workload Status / Pace */}
          <div
            id="summary-workload-status"
            className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between sm:col-span-2 lg:col-span-1"
          >
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Workload Capacity Status</span>
              <p className="text-xs font-semibold text-slate-700 leading-snug">
                {workloadSummary.pendingCount === 0
                  ? 'All tasks completed! Great job.'
                  : workloadSummary.totalHours > 12
                  ? 'Heavy load — plan ahead across the week.'
                  : workloadSummary.totalHours > 5
                  ? 'Moderate load — steady pace recommended.'
                  : 'Manageable load — on track with deadlines.'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-emerald-600 shadow-2xs shrink-0 ml-2">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* At Risk Tasks Notification Banner */}
      {filterCounts['At Risk'] > 0 && (
        <div
          id="at-risk-notification-banner"
          className="p-4 sm:p-4.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-300/90 dark:border-rose-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-rose-950 dark:text-rose-100 shadow-2xs transition-all"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0 shadow-xs mt-0.5">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-rose-900 dark:text-rose-100">
                  ⚠️ {filterCounts['At Risk']} {filterCounts['At Risk'] === 1 ? 'Task is' : 'Tasks are'} At Risk!
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 text-[10px] font-extrabold uppercase tracking-wider">
                  Not Started • Due in &lt; 48 Hours
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
                {filterCounts['At Risk'] === 1
                  ? 'This task has a deadline within 48 hours but has not been started yet. Launch a focus session to prevent last-minute stress!'
                  : 'These tasks have deadlines within 48 hours but have not been started yet. Launch focus sessions to keep your semester on schedule!'}
              </p>
            </div>
          </div>
          <button
            id="view-at-risk-tasks-banner-btn"
            type="button"
            onClick={() => setActiveFilter('At Risk')}
            className="self-end sm:self-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>Filter At Risk ({filterCounts['At Risk']})</span>
          </button>
        </div>
      )}

      {/* Search, Filter bar & Sort */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-tasks-input"
              type="text"
              placeholder="Search tasks, courses, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Sort:</span>
            <select
              id="sort-tasks-select"
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="Priority">Priority Score</option>
              <option value="Deadline">Deadline</option>
              <option value="Course">Course</option>
              <option value="Estimated time">Estimated Time</option>
            </select>

            <span className="text-slate-300">|</span>

            {/* Grouping Selector */}
            <span className="text-xs font-semibold text-slate-500">Group by:</span>
            <select
              id="group-tasks-select"
              value={groupingMode}
              onChange={(e) => setGroupingMode(e.target.value as GroupingOption)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="none">None (Flat List)</option>
              <option value="course">Course Name</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['All', 'At Risk', 'Today', 'Upcoming', 'Overdue', 'Completed'] as FilterOption[]).map((filter) => {
            const count = filterCounts[filter];
            const isActive = activeFilter === filter;
            const isAtRiskTab = filter === 'At Risk';
            return (
              <button
                key={filter}
                id={`filter-tab-${filter.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? isAtRiskTab
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : isAtRiskTab && count > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-extrabold'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {isAtRiskTab && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                <span>{filter}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isAtRiskTab && count > 0
                      ? 'bg-rose-200 text-rose-900 font-bold'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Priority Color-Coded Indicator Legend */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500 flex-wrap">
          <span className="text-slate-400 font-semibold">Priority indicator:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> High (70–99)
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Medium (40–69)
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Low (&lt;40)
          </span>
        </div>
      </div>

      {/* Bulk Action Toolbar Banner */}
      {(isSelectionMode || selectedTaskIds.length > 0) && (
        <div
          id="bulk-actions-banner"
          className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              id="bulk-select-all-btn"
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id))
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'border-slate-400 bg-slate-900'
                }`}
              >
                {filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id)) && (
                  <Check className="w-3 h-3 stroke-[3]" />
                )}
              </div>
              <span>
                {filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id))
                  ? 'Deselect All'
                  : `Select All (${filteredTasks.length})`}
              </span>
            </button>

            <div className="text-xs font-bold text-slate-300">
              <span className="text-white font-black text-sm mr-1 font-mono">
                {selectedTaskIds.length}
              </span>
              selected
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              id="bulk-complete-tasks-btn"
              type="button"
              disabled={selectedTaskIds.length === 0}
              onClick={handleBulkComplete}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Mark Complete ({selectedTaskIds.length})</span>
            </button>

            <button
              id="bulk-delete-tasks-btn"
              type="button"
              disabled={selectedTaskIds.length === 0}
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span>Delete Selected ({selectedTaskIds.length})</span>
            </button>

            <button
              id="cancel-selection-mode-btn"
              type="button"
              onClick={handleClearSelection}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close Selection Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Task Cards List / Grouped List */}
      <div className="space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search query or clear your filters.'
                : 'No tasks in this category. Click "+ Add Task" to create one.'}
            </p>
          </div>
        ) : groupingMode === 'none' ? (
          <div className="space-y-3">
            {filteredTasks.map((task) => renderTaskCard(task))}
          </div>
        ) : groupingMode === 'course' ? (
          // Group by Course Name
          courses.map((course) => {
            const courseTasks = filteredTasks.filter((t) => t.courseId === course.id);
            if (courseTasks.length === 0) return null;
            return (
              <div key={course.id} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: course.accentHex }}
                  />
                  <h3 className="font-extrabold text-sm text-slate-900 font-display">
                    {course.name} ({course.code})
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    • {courseTasks.length} {courseTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <div className="space-y-3">
                  {courseTasks.map((task) => renderTaskCard(task))}
                </div>
              </div>
            );
          })
        ) : (
          // Group by Due Date
          (['Overdue', 'Today', 'Upcoming', 'Completed'] as const).map((groupKey) => {
            const groupTasks = filteredTasks.filter((t) => {
              const rel = formatDeadlineRelative(t.deadline).text;
              if (groupKey === 'Completed') return t.status === 'completed';
              if (groupKey === 'Overdue') return t.status !== 'completed' && rel === 'Overdue';
              if (groupKey === 'Today') return t.status !== 'completed' && rel === 'Today';
              if (groupKey === 'Upcoming') return t.status !== 'completed' && rel !== 'Today' && rel !== 'Overdue';
              return false;
            });
            if (groupTasks.length === 0) return null;

            return (
              <div key={groupKey} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-900 font-display">
                    {groupKey}
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    • {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <div className="space-y-3">
                  {groupTasks.map((task) => renderTaskCard(task))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
