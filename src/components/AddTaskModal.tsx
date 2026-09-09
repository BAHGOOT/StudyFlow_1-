import { useState, type FormEvent } from 'react';
import { Course, Task, TaskType } from '../types';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { calculateSmartPriority } from '../utils/smartPlanner';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddTask: (task: Task) => void;
}

const TASK_TYPES: TaskType[] = ['Assignment', 'Quiz', 'Exam', 'Project', 'Study', 'Other'];

function getDefaultTomorrowDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T23:59`;
}

export function AddTaskModal({ isOpen, onClose, courses, onAddTask }: AddTaskModalProps) {
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [type, setType] = useState<TaskType>('Assignment');
  const [deadline, setDeadline] = useState(getDefaultTomorrowDeadline);
  const [estimatedMinutes, setEstimatedMinutes] = useState<string | number>(45);
  const [importance, setImportance] = useState(4);
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState('');
  const [maxGrade, setMaxGrade] = useState<string>('');
  const [weightPercentage, setWeightPercentage] = useState<string>('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedCourse = courses.find((c) => c.id === (courseId || courses[0]?.id));

  // Live calculation of smart score for student feedback
  const calculated = calculateSmartPriority(
    {
      name,
      courseId: courseId || courses[0]?.id,
      type,
      deadline,
      estimatedMinutes: Number(estimatedMinutes) || 45,
      importance,
      difficulty,
    },
    new Date(),
    selectedCourse
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a task name');
      return;
    }
    if (!courseId) {
      setError('Please select a course');
      return;
    }

    const parsedMaxGrade = maxGrade ? parseFloat(maxGrade) : (type === 'Exam' || type === 'Quiz' ? 100 : undefined);
    const parsedWeight = weightPercentage ? parseFloat(weightPercentage) : undefined;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: name.trim(),
      courseId,
      type,
      deadline,
      estimatedMinutes: Number(estimatedMinutes) || 45,
      importance,
      difficulty,
      notes: notes.trim() || undefined,
      status: 'todo',
      smartPriorityScore: calculated.score,
      urgencyReason: calculated.reason,
      maxGrade: parsedMaxGrade && !isNaN(parsedMaxGrade) ? parsedMaxGrade : undefined,
      weightPercentage: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : undefined,
    };

    onAddTask(newTask);
    onClose();
    // Reset form
    setName('');
    setNotes('');
    setMaxGrade('');
    setWeightPercentage('');
    setError('');
  };

  return (
    <div
      id="add-task-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="add-task-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">Add Academic Task</h3>
            <p className="text-xs text-slate-500">
              StudyFlow will automatically evaluate priority and fit it into your plan.
            </p>
          </div>
          <button
            id="close-add-task-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Task Name *
            </label>
            <input
              id="task-name-input"
              type="text"
              required
              placeholder="e.g., Calculus Assignment 2 or Physics Problem Set"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* Course & Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Course *
              </label>
              <select
                id="task-course-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Task Type
              </label>
              <select
                id="task-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline & Estimated Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Deadline *
              </label>
              <input
                id="task-deadline-input"
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Estimated Time (minutes)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all w-full">
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseInt(String(estimatedMinutes), 10);
                      const curr = isNaN(parsed) ? 45 : parsed;
                      setEstimatedMinutes(Math.max(5, curr - 15));
                    }}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold text-xs transition-colors border-r border-slate-200 select-none cursor-pointer"
                    title="Decrease time by 15m"
                  >
                    -15m
                  </button>

                  <input
                    id="task-duration-input"
                    type="number"
                    min="5"
                    step="5"
                    max="480"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    className="w-full text-center py-2 bg-white text-sm font-bold text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="45"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseInt(String(estimatedMinutes), 10);
                      const curr = isNaN(parsed) ? 45 : parsed;
                      setEstimatedMinutes(Math.min(480, curr + 15));
                    }}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold text-xs transition-colors border-l border-slate-200 select-none cursor-pointer"
                    title="Increase time by 15m"
                  >
                    +15m
                  </button>
                </div>
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                  ({Math.round(((parseInt(String(estimatedMinutes)) || 45) / 60) * 10) / 10}h)
                </span>
              </div>
            </div>
          </div>

          {/* Importance & Difficulty Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Importance */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Importance (1–5)
                </label>
                <span className="text-xs font-bold text-indigo-600">{importance}/5</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    type="button"
                    key={`importance-${lvl}`}
                    onClick={() => setImportance(lvl)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      importance >= lvl
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Grade impact & weight</p>
            </div>

            {/* Difficulty */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Difficulty (1–5)
                </label>
                <span className="text-xs font-bold text-amber-600">{difficulty}/5</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    type="button"
                    key={`diff-${lvl}`}
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      difficulty >= lvl
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Mental effort & complexity</p>
            </div>
          </div>

          {/* Optional Exam & Quiz Grade Tracking Fields */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Assessment & Grade Tracking</span>
                {(type === 'Exam' || type === 'Quiz' || type === 'Assignment') && (
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Recommended for {type}
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Max Points / Max Score
                </label>
                <input
                  id="task-max-grade-input"
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder={type === 'Exam' ? '100' : '20'}
                  value={maxGrade}
                  onChange={(e) => setMaxGrade(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">e.g., 20, 50, 100 total pts</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Course Weight (%)
                </label>
                <input
                  id="task-weight-percent-input"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="e.g. 15"
                  value={weightPercentage}
                  onChange={(e) => setWeightPercentage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">% of overall course grade</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="task-notes-input"
              rows={2}
              placeholder="e.g., Specific chapters, questions, test criteria..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Dynamic Smart Priority Score Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-xs font-bold text-slate-800">Calculated Smart Priority:</span>
                <p className="text-[11px] text-slate-500">{calculated.reason}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-mono font-bold text-indigo-600">
                {calculated.score}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">/100</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              id="cancel-add-task"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-add-task"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all active:scale-[0.98]"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
