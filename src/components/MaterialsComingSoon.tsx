import { useState } from 'react';
import {
  Library,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  FileText,
  Calculator,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface MaterialsComingSoonProps {
  onNavigateBack: () => void;
  userEmail?: string;
}

export function MaterialsComingSoon({ onNavigateBack, userEmail }: MaterialsComingSoonProps) {
  const [notified, setNotified] = useState(false);

  const previewCapabilities = [
    {
      icon: FileText,
      title: 'Syllabus & Lecture Slide Ingestion',
      description:
        'Upload course PDFs, lecture slides, and weekly syllabi. The AI automatically parses reading assignments, exam weightings, and key schedule milestones.',
    },
    {
      icon: Calculator,
      title: 'Automated Formula & Theorem Sheets',
      description:
        'Generate concise high-yield reference cards containing formulas, governing laws, and key definitions derived directly from your course documents.',
    },
    {
      icon: BookOpen,
      title: 'Grounded Study Blueprint Integration',
      description:
        'Connect individual planner study sessions to precise page ranges and exercise sets in your textbook or lecture slides.',
    },
    {
      icon: MessageSquare,
      title: 'Interactive Lecture Q&A Assistant',
      description:
        'Ask questions directly about lecture materials and receive contextual explanations with exact slide and chapter citations.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div
        id="materials-coming-soon-card"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-50/60 to-white dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                id="materials-coming-soon-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Coming Soon for Students</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Admin Preview Only</span>
              </span>
            </div>

            {/* Title */}
            <div>
              <h1
                id="materials-coming-soon-title"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Course Materials & AI Document Hub
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                The Material Vault is currently in closed preview for university administrators and instructors while fine-tuning AI document extraction and syllabus grounding.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="materials-notify-button"
                type="button"
                onClick={() => setNotified(true)}
                disabled={notified}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  notified
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm'
                }`}
              >
                {notified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>You're on the early access list!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Notify Me When Live</span>
                  </>
                )}
              </button>

              <button
                id="materials-back-to-dashboard"
                type="button"
                onClick={onNavigateBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <span>Back to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visual Icon Illustration */}
          <div className="hidden sm:flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-200/50 dark:border-indigo-800/60 shrink-0 text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Library className="w-10 h-10 stroke-[1.8]" />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-indigo-500 dark:text-indigo-400">Preview</span>
          </div>
        </div>
      </div>

      {/* Feature Teasers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>What's In The Materials Hub</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Preview of upcoming features)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {previewCapabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                id={`materials-feature-preview-${index}`}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-9">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Access Notice */}
      <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium text-slate-800 dark:text-slate-200">
            Are you an administrator or course instructor?
          </p>
          <p>
            The Materials tab is unlocked exclusively for administrative accounts (such as <span className="font-mono font-medium text-slate-700 dark:text-slate-300">mohamedelkoramy97@gmail.com</span>). If you manage this institution, please sign in with your designated administrator email.
          </p>
          {userEmail && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Current signed-in account: <span className="font-semibold">{userEmail}</span> (Student account)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
