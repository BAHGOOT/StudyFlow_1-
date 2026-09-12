import React, { useState, useMemo } from 'react';
import { Course, Task, CourseMaterial } from '../types';
import {
  X,
  Printer,
  BookOpen,
  FileText,
  Award,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  GraduationCap,
  Download,
  Info,
} from 'lucide-react';
import { calculateCourseGrade, getStatusBadgeConfig } from '../utils/gradeCalculator';
import { formatDeadlineRelative } from '../utils/smartPlanner';

interface CourseResourceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  tasks: Task[];
  materials?: CourseMaterial[];
}

export function CourseResourceHubModal({
  isOpen,
  onClose,
  course,
  tasks = [],
  materials = [],
}: CourseResourceHubModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'materials' | 'formulas' | 'upcoming' | 'results'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen || !course) return null;

  // Safe fallback arrays
  const safeMaterials = materials || [];
  const safeTasks = tasks || [];

  // Filter materials for this course
  const courseMaterials = useMemo(() => {
    return safeMaterials.filter(
      (m) =>
        m.courseId === course.id ||
        (m.courseName && m.courseName.toLowerCase() === course.name.toLowerCase())
    );
  }, [safeMaterials, course]);

  // Filter tasks for this course
  const courseTasks = useMemo(() => safeTasks.filter((t) => t.courseId === course.id), [safeTasks, course]);

  // Split into active upcoming vs completed graded quizzes/exams
  const activeUpcomingTasks = useMemo(() => {
    return courseTasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [courseTasks]);

  const pastQuizExamResults = useMemo(() => {
    return courseTasks
      .filter((t) => t.status === 'completed' && (t.type === 'Quiz' || t.type === 'Exam' || t.achievedGrade !== undefined))
      .sort((a, b) => new Date(b.completedAt || b.deadline).getTime() - new Date(a.completedAt || a.deadline).getTime());
  }, [courseTasks]);

  // Aggregate formulas across all course materials
  const aggregatedFormulas = useMemo(() => {
    const formulasList: {
      concept: string;
      formulaOrRule?: string;
      description: string;
      materialTitle: string;
    }[] = [];

    courseMaterials.forEach((mat) => {
      if (mat.keyFormulasAndConcepts && Array.isArray(mat.keyFormulasAndConcepts)) {
        mat.keyFormulasAndConcepts.forEach((f) => {
          formulasList.push({
            ...f,
            materialTitle: mat.title,
          });
        });
      }
    });

    // Default fallbacks if no uploaded material formulas exist yet
    if (formulasList.length === 0) {
      if (course.id.includes('calc') || course.name.toLowerCase().includes('calc')) {
        formulasList.push(
          {
            concept: 'Power Rule of Differentiation',
            formulaOrRule: 'd/dx (x^n) = n * x^(n-1)',
            description: 'Fundamental derivative rule for power functions.',
            materialTitle: 'Calculus Core Reference',
          },
          {
            concept: 'Product Rule',
            formulaOrRule: 'd/dx [u(x) * v(x)] = u\'(x)v(x) + u(x)v\'(x)',
            description: 'Used when taking the derivative of a product of two functions.',
            materialTitle: 'Calculus Core Reference',
          },
          {
            concept: 'Chain Rule',
            formulaOrRule: 'd/dx f(g(x)) = f\'(g(x)) * g\'(x)',
            description: 'Used for taking derivatives of composite functions.',
            materialTitle: 'Calculus Core Reference',
          }
        );
      } else if (course.id.includes('phys') || course.name.toLowerCase().includes('phys')) {
        formulasList.push(
          {
            concept: 'Newton Second Law',
            formulaOrRule: 'F_net = m * a',
            description: 'Net force equals mass times acceleration.',
            materialTitle: 'Physics Reference Sheet',
          },
          {
            concept: 'Kinematic Equation for Displacement',
            formulaOrRule: 'Δx = v_0 * t + 0.5 * a * t^2',
            description: 'Displacement with constant acceleration a over time t.',
            materialTitle: 'Physics Reference Sheet',
          }
        );
      } else {
        formulasList.push({
          concept: `${course.name} Key Concept 1`,
          formulaOrRule: 'Key Theorem / Core Formula',
          description: `Primary conceptual principle for ${course.name}.`,
          materialTitle: 'General Course Syllabus',
        });
      }
    }

    if (!searchQuery.trim()) return formulasList;
    const q = searchQuery.toLowerCase();
    return formulasList.filter(
      (item) =>
        item.concept.toLowerCase().includes(q) ||
        (item.formulaOrRule && item.formulaOrRule.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q)
    );
  }, [courseMaterials, course, searchQuery]);

  // Academic Grade Summary
  const gradeSummary = calculateCourseGrade(course.id, tasks);
  const badgeConfig = getStatusBadgeConfig(gradeSummary.statusBadge);

  const handlePrint = () => {
    window.print();
  };

  const safeCopyToClipboard = (text: string): boolean => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed'; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
      return false;
    }
  };

  const handleCopyFormula = (rule: string) => {
    safeCopyToClipboard(rule);
    setCopiedFormula(rule);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const handleCopyHubSummary = () => {
    const summaryText = `
==================================================
📚 COURSE RESOURCE HUB SUMMARY: ${course.name} (${course.code})
==================================================
Instructor: ${course.professor || 'N/A'}
Current Course Grade: ${gradeSummary.hasGrades ? gradeSummary.percentageFormatted + ' (' + gradeSummary.letterGrade + ')' : 'Pending'}

--- 🔑 KEY FORMULAS & CONCEPTS ---
${aggregatedFormulas.map((f, i) => `${i + 1}. ${f.concept}: ${f.formulaOrRule || ''}\n   Note: ${f.description}`).join('\n\n')}

--- ⏰ UPCOMING TASKS & DEADLINES ---
${activeUpcomingTasks.map((t) => `- [${t.type}] ${t.name} (Due: ${t.deadline})`).join('\n')}

--- 🏆 PAST QUIZ & EXAM RESULTS ---
${pastQuizExamResults.map((t) => `- ${t.name}: ${t.achievedGrade}/${t.maxGrade} pts (${t.conceptMasteryStatus || 'Completed'})`).join('\n')}
==================================================
`;
    safeCopyToClipboard(summaryText.trim());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <>
      {/* Print-Only Style Injection */}
      <style>{`
        @media print {
          /* Hide everything in the body except the overlay content */
          body > *:not(#course-resource-hub-overlay),
          #root > *:not(#course-resource-hub-overlay),
          .no-print {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }

          /* Force the overlay to layout relative and expand naturally */
          #course-resource-hub-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: block !important;
            overflow: visible !important;
            z-index: auto !important;
          }

          /* Force the card to fit standard printing page width */
          #course-resource-hub-card {
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }

          /* Allow content to flow naturally across pages instead of scrolling inside a container */
          #printable-course-resource-hub {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            padding: 24px !important;
          }
        }
      `}</style>

      <div
        id="course-resource-hub-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto"
      >
        <div
          id="course-resource-hub-card"
          className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-4 max-h-[92vh]"
        >
          {/* Top Header with Course Accent */}
          <div
            className="p-6 sm:p-7 text-white relative flex flex-col justify-between shrink-0"
            style={{ backgroundColor: course.accentHex }}
          >
            <button
              type="button"
              onClick={onClose}
              className="no-print absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-extrabold uppercase tracking-wider text-white">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Central Resource Hub</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-xs font-mono font-bold text-white/90">
                  {course.code}
                </span>
                {course.credits && (
                  <span className="px-2 py-0.5 rounded-full bg-black/20 text-xs font-bold text-white/90">
                    {course.credits} Credits
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                {course.name}
              </h2>

              <p className="text-xs text-white/90 font-medium">
                {course.professor ? `Instructor: ${course.professor} • ` : ''}
                {courseMaterials.length} Materials • {aggregatedFormulas.length} Formulas • {activeUpcomingTasks.length} Active Tasks
              </p>
            </div>

            {/* Quick Actions Bar (Print / Copy Summary) */}
            <div className="no-print mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/90">
                  Current Grade:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-900 text-xs font-extrabold font-mono shadow-xs">
                  {gradeSummary.hasGrades ? `${gradeSummary.percentageFormatted} (${gradeSummary.letterGrade})` : 'Pending'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHubSummary}
                  className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/30 active:scale-95"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? 'Copied Summary!' : 'Copy Hub Summary'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  id="print-resource-hub-btn"
                  className="px-4 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print / Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="no-print flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'all'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All-in-One Printable View</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'materials'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Materials ({courseMaterials.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('formulas')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'formulas'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Formula Sheets ({aggregatedFormulas.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'upcoming'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming Tasks ({activeUpcomingTasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'results'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Past Quiz Results ({pastQuizExamResults.length})</span>
            </button>
          </div>

          {/* Printable Body Container */}
          <div
            id="printable-course-resource-hub"
            className="p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[calc(92vh-220px)]"
          >
            {/* SECTION 1: MATERIALS & LECTURES */}
            {(activeTab === 'all' || activeTab === 'materials') && (
              <section id="hub-section-materials" className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Course Materials & Syllabus Guides</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {courseMaterials.length} Documents
                  </span>
                </div>

                {courseMaterials.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                    <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No materials uploaded for {course.name} yet.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Upload PDFs or slide decks in the Course Detail or Materials tab to auto-extract chapter outlines and formulas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseMaterials.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold uppercase">
                              {mat.fileType}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                              {mat.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {mat.fileName} • {mat.fileSizeStr || '2.5 MB'} • {mat.pageCount ? `${mat.pageCount} pages` : 'Document'}
                            </p>
                          </div>
                        </div>

                        {/* Topics Summary */}
                        {mat.topicsSummary && mat.topicsSummary.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Key Topics Covered:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {mat.topicsSummary.map((topic, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 2: FORMULA SHEETS & KEY CONCEPTS */}
            {(activeTab === 'all' || activeTab === 'formulas') && (
              <section id="hub-section-formulas" className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Formula Sheet & Key Theorems</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Core rules, equations, and definitions required for quizzes & exams.
                    </p>
                  </div>

                  {/* Search Filter input */}
                  <div className="no-print relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search formulas..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aggregatedFormulas.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:to-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                          {item.concept}
                        </span>
                        {item.formulaOrRule && (
                          <button
                            type="button"
                            onClick={() => handleCopyFormula(item.formulaOrRule!)}
                            className="no-print p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors cursor-pointer"
                            title="Copy Formula"
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
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 font-mono font-bold text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 tracking-wide select-all text-center">
                          {item.formulaOrRule}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="pt-1 text-[10px] text-slate-400 font-mono">
                        Source: {item.materialTitle}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 3: UPCOMING TASKS & MAJOR DEADLINES */}
            {(activeTab === 'all' || activeTab === 'upcoming') && (
              <section id="hub-section-upcoming" className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Upcoming Tasks & Major Deadlines</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {activeUpcomingTasks.length} Pending
                  </span>
                </div>

                {activeUpcomingTasks.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      All tasks for {course.name} are completed!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeUpcomingTasks.map((t) => {
                      const rel = formatDeadlineRelative(t.deadline);
                      return (
                        <div
                          key={t.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold uppercase">
                                {t.type}
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                {t.name}
                              </h4>
                            </div>
                            {t.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {t.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="text-right">
                              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">
                                {rel.text}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {t.estimatedMinutes} min estimated
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 4: PAST QUIZ & EXAM RESULTS */}
            {(activeTab === 'all' || activeTab === 'results') && (
              <section id="hub-section-results" className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Past Quiz & Exam Performance History</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {pastQuizExamResults.length} Graded Tests
                  </span>
                </div>

                {pastQuizExamResults.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                    <Award className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No recorded quiz or exam scores yet.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      When you complete a quiz or exam, record your score to track your academic mastery.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pastQuizExamResults.map((t) => {
                      const max = t.maxGrade || 100;
                      const achieved = t.achievedGrade || 0;
                      const pct = Math.round((achieved / max) * 100);
                      const isMastered = pct >= 80;

                      return (
                        <div
                          key={t.id}
                          className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                              {t.type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isMastered
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {t.conceptMasteryStatus || (isMastered ? 'Mastered' : 'Requires Remediation')}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {t.name}
                          </h4>

                          <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                              {achieved} / {max} <span className="text-xs text-slate-400 font-sans font-normal">pts</span>
                            </span>
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="no-print p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Printable Course Resource Hub v1.0</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
