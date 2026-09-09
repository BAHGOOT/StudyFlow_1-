import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Target,
  CheckSquare,
  Brain,
  Play,
  Sparkles,
  Send,
  RefreshCw,
  Award,
} from 'lucide-react';
import { Task, Course, CourseMaterial } from '../types';

interface SessionBlueprintDrawerProps {
  task: Task | null;
  courses: Course[];
  materials: CourseMaterial[];
  onClose: () => void;
  onStartFocusSession: (task: Task) => void;
}

export function SessionBlueprintDrawer({
  task,
  courses,
  materials,
  onClose,
  onStartFocusSession,
}: SessionBlueprintDrawerProps) {
  if (!task) return null;

  const course = courses.find((c) => c.id === task.courseId);
  const material = materials.find((m) => m.id === task.materialId) || materials.find((m) => m.courseId === task.courseId);

  // AI Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [isAskingAI, setIsAskingAI] = useState(false);

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<{
    quizTitle: string;
    questions: { id: string; question: string; options: string[]; correctOptionIndex: number; explanation: string }[];
  } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setIsAskingAI(true);

    try {
      const res = await fetch('/api/materials/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          materialContext: material,
          taskContext: { ...task, courseName: course?.name },
        }),
      });
      const json = await res.json();
      setChatMessages((prev) => [...prev, { sender: 'ai', text: json.answer || 'Answer generated.' }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Based on your assigned session for ${task.name}, key focus areas include ${task.targetOutcome || 'mastering problem sets'}.`,
        },
      ]);
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizSubmitted(false);
    setQuizAnswers({});

    try {
      const res = await fetch('/api/materials/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialContext: material,
          taskContext: { ...task, courseName: course?.name },
        }),
      });
      const json = await res.json();
      if (json.quiz && json.quiz.questions) {
        setActiveQuiz(json.quiz);
      }
    } catch {
      setActiveQuiz({
        quizTitle: `Practice Quiz: ${task.name}`,
        questions: [
          {
            id: 'q1',
            question: `What is the target outcome of ${task.name}?`,
            options: [
              task.targetOutcome || 'Master core problem-solving techniques',
              'Calculate basic interest rates',
              'Design standard database tables',
              'Review general history dates',
            ],
            correctOptionIndex: 0,
            explanation: `The session blueprint specifies: "${task.targetOutcome}".`,
          },
        ],
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: course?.accentHex || '#6366f1' }}
              >
                {course?.code || 'Course'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {task.estimatedMinutes} Mins Session
              </span>
            </div>

            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white leading-tight">
              {task.name}
            </h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Session Blueprint & Grounded Materials
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Target Outcome Card */}
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/40">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Target Session Outcome Milestone
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              {task.targetOutcome || 'By the end of this session, master core analytical principles and problem sets.'}
            </p>
          </div>

          {/* Assigned Reading Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-500" />
              Exact Assigned Reading
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              📖 {task.exactReading || (material ? `${material.chapterOutline[0]?.pageRange || 'Pages 1–25'} in ${material.title}` : `Chapter 2 in ${course?.name || 'Textbook'}`)}
            </p>
            {material && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Source Document: <span className="font-semibold">{material.fileName}</span>
              </p>
            )}
          </div>

          {/* Practice Exercise Targets */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              Assigned Practice Target
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              📝 {task.exerciseTarget || 'Complete practice problem set in course material.'}
            </p>
          </div>

          {/* Key Formulas & Concepts Box */}
          {((task.keyConceptsList && task.keyConceptsList.length > 0) || (material?.keyFormulasAndConcepts && material.keyFormulasAndConcepts.length > 0)) && (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-800/40">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-amber-500" />
                Key Formulas & Theoretical Principles
              </div>
              <div className="space-y-2">
                {material?.keyFormulasAndConcepts ? (
                  material.keyFormulasAndConcepts.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mb-0.5">{item.concept}</span>
                      {item.formulaOrRule && (
                        <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                          {item.formulaOrRule}
                        </code>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {task.keyConceptsList?.map((concept, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800">
                        {concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ask AI & Quiz Widget */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Ask Document AI Tutor
              </h3>
              <button
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1"
              >
                {isGeneratingQuiz ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3 text-amber-300" />}
                <span>Practice Quiz</span>
              </button>
            </div>

            {/* Quiz View */}
            {activeQuiz && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">{activeQuiz.quizTitle}</div>
                {activeQuiz.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Q{qIdx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = quizAnswers[q.id] === oIdx;
                        const isCorrect = q.correctOptionIndex === oIdx;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                            disabled={quizSubmitted}
                            className={`p-2 rounded-lg text-xs text-left border ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'bg-emerald-100 text-emerald-900 font-bold border-emerald-500'
                                  : isSelected
                                  ? 'bg-rose-100 text-rose-900 border-rose-500'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                                : isSelected
                                ? 'bg-indigo-50 text-indigo-900 font-bold border-indigo-500'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!quizSubmitted ? (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    Check Answers
                  </button>
                ) : (
                  <p className="text-xs font-bold text-emerald-600 text-center">Great effort!</p>
                )}
              </div>
            )}

            {/* Chat Messages */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="max-h-36 overflow-y-auto space-y-2 text-xs">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-400 text-center py-2">
                    Ask any question about {task.name}...
                  </p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`p-2 rounded-xl text-xs ${msg.sender === 'user' ? 'bg-indigo-600 text-white ml-6' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 mr-6'}`}>
                      {msg.text}
                    </div>
                  ))
                )}
                {isAskingAI && (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                    <span>AI Tutor thinking...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="flex-1 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isAskingAI}
                  className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Launch Focus Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => {
              onClose();
              onStartFocusSession(task);
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Document Focus Session ({task.estimatedMinutes} Mins)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
