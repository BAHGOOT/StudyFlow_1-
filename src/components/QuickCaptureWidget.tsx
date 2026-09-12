import React, { useState, useEffect } from 'react';
import { Course, Task, CourseMaterial, CapturedNote } from '../types';
import {
  Zap,
  Plus,
  CheckCircle2,
  Trash2,
  BookOpen,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  Check,
  Tag,
  ChevronDown,
} from 'lucide-react';

interface QuickCaptureWidgetProps {
  courses: Course[];
  materials?: CourseMaterial[];
  onAddTask?: (taskData: Partial<Task>) => void;
  onNavigateToTasks?: () => void;
}

const STORAGE_KEY = 'study_planner_captured_notes';

const INITIAL_NOTES: CapturedNote[] = [
  {
    id: 'note-1',
    content: 'Professor mentioned 30% of Exam 2 will cover 2nd order differential equations.',
    courseId: 'calc-101',
    courseName: 'Calculus I',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    tags: ['Exam Prep'],
  },
  {
    id: 'note-2',
    content: 'Review chapter 4 page 142 on heat transfer formulas before Friday lab session.',
    courseId: 'phys-201',
    courseName: 'Physics II',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    tags: ['Lab Prep'],
  },
];

export function QuickCaptureWidget({
  courses,
  materials = [],
  onAddTask,
  onNavigateToTasks,
}: QuickCaptureWidgetProps) {
  const [notes, setNotes] = useState<CapturedNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved captured notes', e);
    }
    return INITIAL_NOTES;
  });

  const [inputContent, setInputContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [convertingNoteId, setConvertingNoteId] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [conversionSuccessMsg, setConversionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save captured notes', e);
    }
  }, [notes]);

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const course = courses.find((c) => c.id === selectedCourseId);
    const material = materials.find((m) => m.id === selectedMaterialId);

    const newNote: CapturedNote = {
      id: `note-${Date.now()}`,
      content: inputContent.trim(),
      courseId: course?.id,
      courseName: course?.name,
      materialId: material?.id,
      materialTitle: material?.title,
      createdAt: new Date().toISOString(),
      isConvertedToTask: false,
    };

    setNotes((prev) => [newNote, ...prev]);
    setInputContent('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleStartConversion = (note: CapturedNote) => {
    setConvertingNoteId(note.id);
  };

  const handleConfirmTaskConversion = (note: CapturedNote) => {
    const course = courses.find((c) => c.id === note.courseId) || courses[0];

    // Build task object
    const newTask: Partial<Task> = {
      name: note.content.length > 60 ? `${note.content.substring(0, 57)}...` : note.content,
      courseId: course ? course.id : courses[0]?.id || 'gen',
      type: 'Study',
      deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
      estimatedMinutes: estimatedMinutes || 30,
      importance: 3,
      difficulty: 3,
      notes: `Captured Takeaway: ${note.content}${note.materialTitle ? `\nAssociated Material: ${note.materialTitle}` : ''}`,
      status: 'todo',
      smartPriorityScore: 75,
      materialId: note.materialId,
      materialTitle: note.materialTitle,
    };

    if (onAddTask) {
      onAddTask(newTask);
    }

    // Mark note as converted
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, isConvertedToTask: true, convertedTaskId: `task-${Date.now()}` } : n
      )
    );

    setConvertingNoteId(null);
    setConversionSuccessMsg(`Converted takeaway into a new task in ${course?.name || 'My Tasks'}!`);
    setTimeout(() => setConversionSuccessMsg(null), 3500);
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <section
      id="dashboard-quick-capture-widget"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Quick Capture</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase font-mono">
                {notes.filter((n) => !n.isConvertedToTask).length} Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jot down spontaneous lecture takeaways or study ideas to convert into tasks.
            </p>
          </div>
        </div>

        {onNavigateToTasks && (
          <button
            type="button"
            onClick={onNavigateToTasks}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <span>My Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Success Toast */}
      {conversionSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{conversionSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Capture Input Form */}
      <form onSubmit={handleCapture} className="space-y-3">
        <div className="relative">
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCapture(e);
              }
            }}
            placeholder="Jot down a takeaway, exam hint, or task idea... (Press Enter)"
            rows={2}
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Options Row (Course select & Material select) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Course Select */}
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="appearance-none pl-7 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
              <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Material Link Select (if available) */}
            {materials.length > 0 && (
              <div className="relative">
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="appearance-none pl-7 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer max-w-[160px] truncate"
                >
                  <option value="">Link Material...</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputContent.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture Takeaway</span>
          </button>
        </div>
      </form>

      {/* Captured Notes Feed */}
      <div className="space-y-2.5 pt-1">
        {notes.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-400 font-medium">No quick takeaways captured yet.</p>
          </div>
        ) : (
          notes.map((note) => {
            const course = courses.find((c) => c.id === note.courseId);
            const isConverting = convertingNoteId === note.id;

            return (
              <div
                key={note.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  note.isConvertedToTask
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {course && (
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shadow-2xs"
                          style={{ backgroundColor: course.accentHex }}
                        >
                          {course.code}
                        </span>
                      )}

                      {note.materialTitle && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{note.materialTitle}</span>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatRelativeTime(note.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {note.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete note"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Convert to Task bar or Converted Badge */}
                {note.isConvertedToTask ? (
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Converted to Task</span>
                  </div>
                ) : isConverting ? (
                  <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Convert takeaway to Task:
                      </span>
                      <span className="text-[11px] font-mono font-bold text-indigo-600">
                        {estimatedMinutes} min
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-slate-500 font-medium shrink-0">
                        Duration:
                      </label>
                      <select
                        value={estimatedMinutes}
                        onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                        className="px-2 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                      >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins (1 hr)</option>
                        <option value={90}>90 mins</option>
                      </select>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => setConvertingNoteId(null)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200/50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmTaskConversion(note)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-2xs"
                        >
                          Confirm Task
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 flex items-center justify-end border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleStartConversion(note)}
                      className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Convert to Task</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
