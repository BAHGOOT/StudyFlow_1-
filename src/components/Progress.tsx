import { Course, Task } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { formatDeadlineRelative, formatDuration } from '../utils/smartPlanner';

interface ProgressProps {
  tasks: Task[];
  courses: Course[];
}

export function Progress({ tasks, courses }: ProgressProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const overdueTasks = activeTasks.filter((t) => formatDeadlineRelative(t.deadline).text === 'Overdue');

  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  const totalCompletedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalEstimatedMinutes = tasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const studyTimeFormatted = formatDuration(totalCompletedMinutes || totalEstimatedMinutes);

  // Dynamic Course progress percentages
  const courseProgressList = courses.map((c) => {
    const cTasks = tasks.filter((t) => t.courseId === c.id);
    const cCompleted = cTasks.filter((t) => t.status === 'completed');
    const rate = cTasks.length > 0 ? Math.round((cCompleted.length / cTasks.length) * 100) : 0;
    return {
      id: c.id,
      name: c.name,
      rate,
      color: c.accentHex || '#4f46e5',
      taskCount: cTasks.length,
      completedCount: cCompleted.length,
    };
  });

  return (
    <div id="progress-page" className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
          My Progress
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Academic semester progress, study velocity, and course completion rates.
        </p>
      </div>

      {/* Top 4 Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Weekly completion */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completion Rate
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold font-display text-slate-900">
            {completionRate}%
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Tasks completed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tasks Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-display text-slate-900">
            {completedTasks.length} <span className="text-base text-slate-400 font-medium">/ {totalTasks}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            {activeTasks.length} tasks remaining
          </p>
        </div>

        {/* Metric 3: Study time */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Workload
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold font-display text-slate-900">
            {studyTimeFormatted}
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Estimated across tasks
          </p>
        </div>

        {/* Metric 4: Overdue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold font-display text-rose-600">
            {overdueTasks.length}
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            {overdueTasks.length > 0 ? 'Urgent attention required' : 'No overdue tasks'}
          </p>
        </div>
      </div>

      {/* Main Breakdown: Course Progress & This Week */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COURSE PROGRESS (Left 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display font-bold text-lg text-slate-900 tracking-tight">
              COURSE PROGRESS
            </h3>
            <span className="text-xs text-slate-400 font-medium">Semester Target</span>
          </div>

          {courseProgressList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No active courses added yet.
            </div>
          ) : (
            <div className="space-y-5">
              {courseProgressList.map((cp) => (
                <div key={cp.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cp.color }}
                      />
                      {cp.name}
                    </span>
                    <span className="font-mono font-bold text-slate-700">{cp.rate}%</span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cp.rate}%`,
                        backgroundColor: cp.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUMMARY (Right 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display font-bold text-lg text-slate-900 tracking-tight">
              TASK STATUS
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Overview
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Completed tasks</span>
              <span className="text-base font-extrabold font-display text-emerald-600">
                {completedTasks.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Active tasks</span>
              <span className="text-base font-extrabold font-display text-indigo-600">
                {activeTasks.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Overdue tasks</span>
              <span className="text-base font-extrabold font-display text-rose-600">
                {overdueTasks.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Enrolled courses</span>
              <span className="text-base font-extrabold font-display text-slate-800">
                {courses.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
