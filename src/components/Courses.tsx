import { useState } from 'react';
import { Course, Task } from '../types';
import { Plus, BookOpen, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { formatDeadlineRelative } from '../utils/smartPlanner';

interface CoursesProps {
  courses: Course[];
  tasks: Task[];
  onOpenAddCourse: () => void;
  onSelectCourseTasks: (courseId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export function Courses({
  courses,
  tasks,
  onOpenAddCourse,
  onSelectCourseTasks,
  onDeleteCourse,
}: CoursesProps) {
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Dynamic Course stats helper
  const getCourseStats = (course: Course) => {
    const courseTasks = tasks.filter((t) => t.courseId === course.id);
    const activeTasks = courseTasks.filter((t) => t.status !== 'completed');
    const completedTasks = courseTasks.filter((t) => t.status === 'completed');

    const totalMinutes = activeTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    const hoursRemaining = Math.round((totalMinutes / 60) * 10) / 10;

    // Find closest upcoming active deadline
    let nextDeadline = 'None';
    if (activeTasks.length > 0) {
      const sortedByDeadline = [...activeTasks].sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
      const closest = sortedByDeadline[0];
      const rel = formatDeadlineRelative(closest.deadline);
      nextDeadline = rel.text;
    }

    const total = courseTasks.length || 1;
    const progress = Math.round((completedTasks.length / total) * 100);

    return {
      activeCount: activeTasks.length,
      completedCount: completedTasks.length,
      hoursRemaining,
      nextDeadline,
      progress,
    };
  };

  const handleConfirmDelete = () => {
    if (courseToDelete && onDeleteCourse) {
      onDeleteCourse(courseToDelete.id);
      setCourseToDelete(null);
    }
  };

  return (
    <div id="courses-page" className="space-y-6 pb-20">
      {/* Top Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            My Courses
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Semester course load, active deadlines, and estimated remaining study requirements.
          </p>
        </div>
        <button
          id="add-course-header-btn"
          onClick={onOpenAddCourse}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Course</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
            No courses in your schedule yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Add your subjects and classes manually to personalize your study dashboard.
          </p>
          <button
            onClick={onOpenAddCourse}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Course</span>
          </button>
        </div>
      ) : (
        /* Course Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const stats = getCourseStats(course);

            return (
              <div
                key={course.id}
                id={`course-card-${course.id}`}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Header with color indicator */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                        style={{ backgroundColor: course.accentHex }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">
                          {course.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono font-medium">
                          {course.code} {course.credits ? `• ${course.credits} Credits` : ''}
                        </p>
                      </div>
                    </div>

                    {onDeleteCourse && (
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(course)}
                        title="Delete Course"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {course.professor && (
                    <p className="text-xs text-slate-500 mb-5 font-medium">
                      Instructor: <span className="text-slate-700">{course.professor}</span>
                    </p>
                  )}

                  {/* Key stats row */}
                  <div className="grid grid-cols-2 gap-3 py-3 px-3.5 bg-slate-50 rounded-xl border border-slate-100 mb-5">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                        Active Tasks
                      </span>
                      <span className="text-base font-extrabold font-display text-slate-900">
                        {stats.activeCount} active tasks
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                        Workload
                      </span>
                      <span className="text-base font-extrabold font-display text-indigo-600">
                        {stats.hoursRemaining}h remaining
                      </span>
                    </div>
                  </div>

                  {/* Next deadline */}
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-4">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Next deadline:</span>
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {stats.nextDeadline}
                    </span>
                  </div>
                </div>

                {/* Bottom card CTA */}
                <div className="pt-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => onSelectCourseTasks(course.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors py-1"
                  >
                    <span>View Course Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Delete Course?
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{courseToDelete.name}</strong>? All associated tasks, study sessions, and lectures for this course will be removed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
