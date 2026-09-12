import { useState } from 'react';
import { Course, Task, PlantedTree, CourseMaterial } from '../types';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  Plus,
  Award,
  Layers,
  Sparkles,
  TrendingUp,
  User,
  Brain,
  Search,
  Copy,
  Check,
  Users,
  GraduationCap,
} from 'lucide-react';
import { formatDeadlineRelative, formatDuration } from '../utils/smartPlanner';
import { simplifyTaskTitle, getSmartPriorityLevel } from './MyTasks';
import { calculateCourseGrade, getStatusBadgeConfig } from '../utils/gradeCalculator';
import { StudyGroupModal } from './StudyGroupModal';
import { CourseResourceHubModal } from './CourseResourceHubModal';

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  tasks: Task[];
  materials?: CourseMaterial[];
  plantedTrees?: PlantedTree[];
  onStartTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenAddTaskForCourse: (courseId: string) => void;
}

export function CourseDetailModal({
  isOpen,
  onClose,
  course,
  tasks,
  materials = [],
  plantedTrees = [],
  onStartTask,
  onToggleTaskComplete,
  onOpenAddTaskForCourse,
}: CourseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'milestones' | 'completed' | 'formulas'>('active');
  const [formulaSearch, setFormulaSearch] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [isStudyGroupOpen, setIsStudyGroupOpen] = useState(false);
  const [isResourceHubOpen, setIsResourceHubOpen] = useState(false);

  if (!isOpen || !course) return null;

  // Filter tasks belonging to this course
  const courseTasks = tasks.filter((t) => t.courseId === course.id);
  const activeTasks = courseTasks.filter((t) => t.status !== 'completed');
  const completedTasks = courseTasks.filter((t) => t.status === 'completed');
  const milestoneTasks = courseTasks.filter((t) => t.type === 'Exam' || t.type === 'Quiz' || t.type === 'Project');

  // Calculate workload & hours
  const activeMinutes = activeTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const activeHours = Math.round((activeMinutes / 60) * 10) / 10;

  // Calculate logged focus minutes from planted trees for this course
  const courseTrees = plantedTrees.filter(
    (tree) => tree.courseId === course.id || tree.courseName.toLowerCase() === course.name.toLowerCase()
  );
  const loggedMinutesFromTrees = courseTrees.reduce((acc, tree) => acc + (tree.focusMinutes || 0), 0);
  const completedTasksMinutes = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalLoggedMinutes = loggedMinutesFromTrees > 0 ? loggedMinutesFromTrees : completedTasksMinutes;
  const totalLoggedHours = Math.round((totalLoggedMinutes / 60) * 10) / 10;

  const totalCount = courseTasks.length || 1;
  const progressPercent = Math.round((completedTasks.length / totalCount) * 100);

  // Academic Grade Calculation
  const gradeSummary = calculateCourseGrade(course.id, tasks);
  const badgeConfig = getStatusBadgeConfig(gradeSummary.statusBadge);

  // Highest priority active task
  const sortedActiveTasks = [...activeTasks].sort((a, b) => b.smartPriorityScore - a.smartPriorityScore);
  const topTask = sortedActiveTasks[0];

  return (
    <div
      id="course-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="course-detail-modal-card"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-4 max-h-[90vh]"
      >
        {/* Header with Course Accent */}
        <div
          className="p-6 text-white relative flex flex-col justify-between"
          style={{ backgroundColor: course.accentHex }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md">
                  {course.code}
                </span>
                {course.credits && (
                  <span className="text-xs font-bold bg-black/20 px-2 py-0.5 rounded-md">
                    {course.credits} Credits
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold font-display leading-tight mt-0.5">
                {course.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 mt-2">
            {course.professor ? (
              <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                <User className="w-3.5 h-3.5" />
                <span>Instructor: {course.professor}</span>
              </div>
            ) : <div />}

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsResourceHubOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Resource Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setIsStudyGroupOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-white/30 active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Study Group</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 block">
                Active Tasks
              </span>
              <span className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                {activeTasks.length} tasks
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/80 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-indigo-500 dark:text-indigo-400 block">
                Est. Workload
              </span>
              <span className="text-lg font-extrabold font-display text-indigo-700 dark:text-indigo-300">
                {activeHours}h remaining
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/80 border border-emerald-100 dark:border-emerald-800/80 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block">
                Time Logged
              </span>
              <span className="text-lg font-extrabold font-display text-emerald-800 dark:text-emerald-300">
                {totalLoggedHours}h focused
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/80 border border-amber-100 dark:border-amber-800/80 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 block">
                Progress
              </span>
              <span className="text-lg font-extrabold font-display text-amber-900 dark:text-amber-200">
                {progressPercent}% done
              </span>
            </div>
          </div>

          {/* Quick Primary Focus Action Banner */}
          {topTask && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-indigo-600/10 to-violet-500/10 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Highest Priority Task
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {simplifyTaskTitle(topTask.name)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Due {formatDeadlineRelative(topTask.deadline).text} • {formatDuration(topTask.estimatedMinutes)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTask(topTask);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Focus Session</span>
              </button>
            </div>
          )}

          {/* Academic Grade & Assessment Progress */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Course Grade & Exam Performance
                </h4>
              </div>

              {gradeSummary.hasGrades ? (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${badgeConfig.badgeClass}`}
                >
                  <span>{badgeConfig.label}</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                  {gradeSummary.pendingCount > 0 ? `${gradeSummary.pendingCount} Pending Exam/Quiz` : 'No Graded Items'}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {gradeSummary.hasGrades ? gradeSummary.percentageFormatted : 'Pending'}
                  </span>
                  {gradeSummary.hasGrades && (
                    <span className="text-sm font-bold text-slate-500 font-display">
                      ({gradeSummary.letterGrade})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {gradeSummary.hasGrades
                    ? `Earned ${gradeSummary.totalAchievedPoints} / ${gradeSummary.totalPossiblePoints} points across ${gradeSummary.gradedCount} assessments`
                    : 'Complete upcoming exams and quizzes to compute running grade'}
                </p>
              </div>

              {gradeSummary.requiresRemediation && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold max-w-xs">
                  ⚠️ Score below 80%. Adaptive remedial review sessions have been automatically added to your study schedule.
                </div>
              )}
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  gradeSummary.hasGrades ? badgeConfig.progressBarClass : 'bg-slate-300 dark:bg-slate-600'
                }`}
                style={{ width: `${gradeSummary.hasGrades ? Math.min(100, Math.max(5, gradeSummary.percentage)) : 0}%` }}
              />
            </div>
          </div>

          {/* Sub-Header Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Active Tasks ({activeTasks.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('milestones')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  activeTab === 'milestones'
                    ? 'bg-amber-500 text-amber-950 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Exams & Milestones ({milestoneTasks.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Completed ({completedTasks.length})
              </button>

              <button
                type="button"
                id="course-formula-sheet-tab"
                onClick={() => setActiveTab('formulas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'formulas'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Formula Sheet</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddTaskForCourse(course.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Tasks List Content */}
          <div className="space-y-3">
            {activeTab === 'active' && (
              activeTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  No active tasks for {course.name}. Click "Add Task" to create one!
                </div>
              ) : (
                activeTasks.map((task) => {
                  const priority = getSmartPriorityLevel(task.smartPriorityScore);
                  const rel = formatDeadlineRelative(task.deadline);

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleTaskComplete(task.id)}
                          className="mt-1 w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:border-indigo-500 cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-emerald-500" />
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {task.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${priority.badgeClass}`}>
                              P{task.smartPriorityScore} {priority.level}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {simplifyTaskTitle(task.name)}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Due: {rel.text}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDuration(task.estimatedMinutes)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartTask(task);
                        }}
                        className="self-end sm:self-center px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start</span>
                      </button>
                    </div>
                  );
                })
              )
            )}

            {activeTab === 'milestones' && (
              milestoneTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  No exams, quizzes, or major project milestones scheduled for this course.
                </div>
              ) : (
                milestoneTasks.map((task) => {
                  const rel = formatDeadlineRelative(task.deadline);
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200">
                              {task.type}
                            </span>
                            {isDone && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Completed ✓
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                            {task.name}
                          </h4>
                          <p className="text-xs text-amber-900/80 dark:text-amber-300 font-mono mt-0.5">
                            Due: {rel.text} ({task.deadline})
                          </p>
                        </div>
                      </div>

                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onStartTask(task);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Prepare</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )
            )}

            {activeTab === 'completed' && (
              completedTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  No completed tasks yet for this course.
                </div>
              ) : (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="line-through font-medium text-slate-700 dark:text-slate-300">
                        {simplifyTaskTitle(task.name)}
                      </span>
                    </div>
                    <span>{formatDuration(task.estimatedMinutes)}</span>
                  </div>
                ))
              )
            )}

            {activeTab === 'formulas' && (() => {
              const courseMaterials = materials.filter((m) => m.courseId === course.id);
              const allFormulas = courseMaterials.flatMap((m) =>
                (m.keyFormulasAndConcepts || []).map((f) => ({
                  ...f,
                  sourceTitle: m.title || m.fileName,
                }))
              );

              // Also include any concepts defined on tasks
              courseTasks.forEach((t) => {
                if (t.keyConceptsList) {
                  t.keyConceptsList.forEach((concept) => {
                    if (!allFormulas.some((f) => f.concept === concept)) {
                      allFormulas.push({
                        concept,
                        formulaOrRule: '',
                        description: `Key concept for ${t.name}`,
                        sourceTitle: t.name,
                      });
                    }
                  });
                }
              });

              const filteredFormulas = allFormulas.filter(
                (f) =>
                  f.concept.toLowerCase().includes(formulaSearch.toLowerCase()) ||
                  f.formulaOrRule?.toLowerCase().includes(formulaSearch.toLowerCase()) ||
                  f.description?.toLowerCase().includes(formulaSearch.toLowerCase())
              );

              return (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search formulas, laws, constants..."
                      value={formulaSearch}
                      onChange={(e) => setFormulaSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {filteredFormulas.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <Brain className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No formulas extracted yet for {course.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Upload lecture slides or textbook PDFs in the Materials tab to automatically extract high-yield formulas, constants, and theorem sheets!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {filteredFormulas.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                                {item.sourceTitle}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                                {item.concept}
                              </h4>
                            </div>

                            {item.formulaOrRule && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.formulaOrRule) {
                                    navigator.clipboard.writeText(item.formulaOrRule);
                                    setCopiedFormula(item.formulaOrRule);
                                    setTimeout(() => setCopiedFormula(null), 2000);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                                title="Copy formula"
                              >
                                {copiedFormula === item.formulaOrRule ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {item.formulaOrRule && (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
                              <code className="text-xs sm:text-sm font-mono font-bold text-amber-700 dark:text-amber-300 block">
                                {item.formulaOrRule}
                              </code>
                            </div>
                          )}

                          {item.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Study Group Sync Modal */}
      <StudyGroupModal
        isOpen={isStudyGroupOpen}
        onClose={() => setIsStudyGroupOpen(false)}
        course={course}
        tasks={tasks}
      />

      {/* Course Resource Hub Modal */}
      <CourseResourceHubModal
        isOpen={isResourceHubOpen}
        onClose={() => setIsResourceHubOpen(false)}
        courseId={course?.id}
        course={course}
        tasks={tasks}
        materials={materials}
      />
    </div>
  );
}
