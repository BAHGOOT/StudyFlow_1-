import { useState, type FormEvent } from 'react';
import { Course } from '../types';
import { X } from 'lucide-react';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Course) => void;
}

const COLOR_OPTIONS = [
  { name: 'Indigo', color: 'indigo', hex: '#4f46e5' },
  { name: 'Amber', color: 'amber', hex: '#d97706' },
  { name: 'Emerald', color: 'emerald', hex: '#059669' },
  { name: 'Violet', color: 'violet', hex: '#7c3aed' },
  { name: 'Rose', color: 'rose', hex: '#e11d48' },
  { name: 'Blue', color: 'blue', hex: '#2563eb' },
  { name: 'Teal', color: 'teal', hex: '#0d9488' },
];

export function AddCourseModal({ isOpen, onClose, onAddCourse }: AddCourseModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [credits, setCredits] = useState<string | number>('3');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Course name is required');
      return;
    }

    const parsedCredits = parseInt(String(credits), 10);
    const finalCredits = isNaN(parsedCredits) ? 3 : Math.max(1, Math.min(12, parsedCredits));

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || name.slice(0, 4).toUpperCase(),
      professor: professor.trim() || undefined,
      color: selectedColor.color,
      accentHex: selectedColor.hex,
      credits: finalCredits,
    };

    onAddCourse(newCourse);
    onClose();
    setName('');
    setCode('');
    setProfessor('');
    setError('');
  };

  return (
    <div
      id="add-course-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overscroll-contain"
    >
      <div
        id="add-course-modal-container"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 overscroll-contain"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">Add New Course</h3>
            <p className="text-xs text-slate-500">Add course to your semester workload</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Organic Chemistry or Algorithms"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Course Code
              </label>
              <input
                type="text"
                placeholder="e.g., CS 301"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Credits
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all">
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(String(credits), 10);
                    const curr = isNaN(parsed) ? 3 : parsed;
                    setCredits(Math.max(1, curr - 1));
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold text-base transition-colors border-r border-slate-200 select-none cursor-pointer flex items-center justify-center min-w-[38px]"
                  title="Decrease credits"
                >
                  −
                </button>

                <input
                  type="number"
                  min="1"
                  max="12"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="w-full text-center py-2 bg-white text-sm font-bold text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="3"
                />

                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(String(credits), 10);
                    const curr = isNaN(parsed) ? 3 : parsed;
                    setCredits(Math.min(12, curr + 1));
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold text-base transition-colors border-l border-slate-200 select-none cursor-pointer flex items-center justify-center min-w-[38px]"
                  title="Increase credits"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Professor (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Prof. Sterling"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Color Tag
            </label>
            <div className="flex items-center gap-2 pt-1">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.color}
                  onClick={() => setSelectedColor(opt)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor.color === opt.color
                      ? 'scale-125 ring-2 ring-offset-2 ring-slate-400'
                      : 'hover:scale-110 opacity-85'
                  }`}
                  style={{ backgroundColor: opt.hex }}
                  title={opt.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm"
            >
              Add Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
