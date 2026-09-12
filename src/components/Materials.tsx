import React, { useState, useRef } from 'react';
import {
  Library,
  Upload,
  FileText,
  BookOpen,
  Sparkles,
  Search,
  Trash2,
  ChevronRight,
  HelpCircle,
  X,
  FileCode,
  CheckCircle2,
  Layers,
  Brain,
  MessageSquare,
  Send,
  RefreshCw,
  Award,
  Loader2,
  FileDown,
} from 'lucide-react';
import { Course, CourseMaterial, MaterialOutlineTopic, MaterialFormulaConcept, Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUploadThing } from '../utils/uploadthing';

interface MaterialsProps {
  courses: Course[];
  materials: CourseMaterial[];
  tasks: Task[];
  onAddMaterial: (material: CourseMaterial) => void;
  onDeleteMaterial: (materialId: string) => void;
  onStartFocusSession?: (task: Task) => void;
}

export function Materials({
  courses,
  materials,
  tasks,
  onAddMaterial,
  onDeleteMaterial,
  onStartFocusSession,
}: MaterialsProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCourseId, setUploadCourseId] = useState<string>(courses[0]?.id || '');
  const [uploadExamId, setUploadExamId] = useState<string>('none');
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string>('');

  // Filter exam milestones for linking materials
  const examMilestones = tasks.filter(
    (t) =>
      t.type === 'Exam' ||
      t.type === 'Quiz' ||
      t.type === 'Project' ||
      t.name.toLowerCase().includes('exam') ||
      t.name.toLowerCase().includes('midterm')
  );

  // Manual note mode
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCourseId, setNoteCourseId] = useState<string>(courses[0]?.id || '');
  const [noteExamId, setNoteExamId] = useState<string>('none');

  // Detail / Knowledge modal
  const [activeMaterial, setActiveMaterial] = useState<CourseMaterial | null>(null);

  // AI Chat State inside Knowledge Modal
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);

  // AI Quiz State inside Knowledge Modal
  const [activeQuiz, setActiveQuiz] = useState<{
    quizTitle: string;
    questions: { id: string; question: string; options: string[]; correctOptionIndex: number; explanation: string }[];
  } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Filter materials
  const filteredMaterials = (materials || []).filter((mat) => {
    if (!mat) return false;
    const matchesCourse = selectedCourseId === 'all' || mat.courseId === selectedCourseId;
    const query = (searchQuery || '').toLowerCase();
    const titleMatch = (mat.title || '').toLowerCase().includes(query);
    const fileMatch = (mat.fileName || '').toLowerCase().includes(query);
    const topicsMatch = Array.isArray(mat.topicsSummary) && mat.topicsSummary.some((t) => (t || '').toLowerCase().includes(query));
    const matchesSearch = query === '' || titleMatch || fileMatch || topicsMatch;
    return matchesCourse && matchesSearch;
  });

  // Calculate totals
  const totalTopics = materials.reduce((acc, m) => acc + (m.topicsSummary?.length || 0), 0);
  const totalFormulas = materials.reduce((acc, m) => acc + (m.keyFormulasAndConcepts?.length || 0), 0);

  // Handle upload completion via Uploadthing
  const handleUploadthingComplete = async (res: any[]) => {
    if (!res || res.length === 0) return;
    setIsUploading(true);
    setUploadStatusMessage('Indexing uploaded materials with AI...');
    const selectedCourse = courses.find((c) => c.id === uploadCourseId) || courses[0];
    const targetExam = examMilestones.find((t) => t.id === uploadExamId);

    for (const fileItem of res) {
      const fileUrl = fileItem.url || fileItem.ufsUrl || '';
      const fileName = fileItem.name || 'Uploaded Document';
      const sizeInBytes = fileItem.size || 0;
      const fileSizeStr = sizeInBytes < 1024 * 1024
        ? `${(sizeInBytes / 1024).toFixed(1)} KB`
        : `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;

      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      let fileType: 'pdf' | 'slides' | 'syllabus' | 'notes' | 'doc' = 'pdf';
      if (['pptx', 'ppt'].includes(extension)) {
        fileType = 'slides';
      } else if (['docx', 'doc'].includes(extension)) {
        fileType = 'doc';
      } else if (fileName.toLowerCase().includes('syllabus')) {
        fileType = 'syllabus';
      } else if (['txt', 'md', 'json'].includes(extension)) {
        fileType = 'notes';
      } else {
        fileType = 'pdf';
      }

      try {
        const aiRes = await fetch('/api/materials/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: fileName,
            fileName,
            fileType,
            courseName: selectedCourse?.name || 'General Course',
            textContent: `Document uploaded via Uploadthing: ${fileName}. File URL: ${fileUrl}`,
            fileUrl,
          }),
        });

        const json = await aiRes.json();
        const aiData = json.data || {};

        const newMat: CourseMaterial = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          courseId: selectedCourse?.id || 'course-gen',
          courseName: selectedCourse?.name || 'General',
          linkedExamId: targetExam ? targetExam.id : undefined,
          linkedExamTitle: targetExam ? targetExam.name : undefined,
          title: aiData.title || fileName,
          fileName,
          fileType,
          fileSizeStr,
          pageCount: aiData.pageCount || 1,
          uploadedAt: new Date().toISOString(),
          topicsSummary: aiData.topicsSummary || ['Uploaded Study Material', 'Core Concepts'],
          chapterOutline: aiData.chapterOutline || [
            { title: 'Section 1: Overview', pageRange: 'Pages 1-10', summary: 'Core theory and concepts.' },
          ],
          keyFormulasAndConcepts: aiData.keyFormulasAndConcepts || [
            { concept: 'Key Formula', formulaOrRule: 'Standard Reference', description: 'Important course definition.' },
          ],
          practiceProblems: aiData.practiceProblems || ['Review uploaded notes and formulas.'],
          fileDataUrl: fileUrl,
        };

        onAddMaterial(newMat);
      } catch (err) {
        console.warn('AI Indexing fallback:', err);
        const fallbackMat: CourseMaterial = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          courseId: selectedCourse?.id || 'course-gen',
          courseName: selectedCourse?.name || 'General',
          linkedExamId: targetExam ? targetExam.id : undefined,
          linkedExamTitle: targetExam ? targetExam.name : undefined,
          title: fileName,
          fileName,
          fileType,
          fileSizeStr,
          pageCount: 1,
          uploadedAt: new Date().toISOString(),
          topicsSummary: ['Uploaded Material', 'Lecture File'],
          chapterOutline: [
            { title: 'Section 1: Overview', pageRange: 'Page 1', summary: 'Content stored via Uploadthing.' },
          ],
          keyFormulasAndConcepts: [
            { concept: 'Direct Upload', formulaOrRule: fileName, description: 'File uploaded via Uploadthing.' },
          ],
          practiceProblems: ['Review uploaded material.'],
          fileDataUrl: fileUrl,
        };
        onAddMaterial(fallbackMat);
      }
    }
    setIsUploading(false);
    setUploadStatusMessage('');
  };

  const { startUpload } = useUploadThing('courseMaterialUploader', {
    onClientUploadComplete: (res) => {
      handleUploadthingComplete(res);
    },
    onUploadError: (error: Error) => {
      console.error('Detailed Uploadthing error in Materials view:', error);
      setIsUploading(false);
      setUploadStatusMessage('');
    },
  });

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    setIsUploading(true);
    setUploadStatusMessage('Uploading & indexing course documents...');

    try {
      const uploadRes = await startUpload(files);
      if (uploadRes && uploadRes.length > 0) {
        return;
      }
    } catch (err) {
      console.error('Uploadthing startUpload failed in Materials, proceeding with client fallback indexing:', err);
    }

    // Direct client processing fallback
    const selectedCourse = courses.find((c) => c.id === uploadCourseId) || courses[0];
    const targetExam = examMilestones.find((t) => t.id === uploadExamId);

    for (const file of files) {
      const fileName = file.name;
      const sizeInBytes = file.size;
      const fileSizeStr = sizeInBytes < 1024 * 1024
        ? `${(sizeInBytes / 1024).toFixed(1)} KB`
        : `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;

      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      let fileType: 'pdf' | 'slides' | 'syllabus' | 'notes' | 'doc' = 'pdf';
      if (['pptx', 'ppt'].includes(extension)) {
        fileType = 'slides';
      } else if (['docx', 'doc'].includes(extension)) {
        fileType = 'doc';
      } else if (fileName.toLowerCase().includes('syllabus')) {
        fileType = 'syllabus';
      } else if (['txt', 'md', 'json'].includes(extension)) {
        fileType = 'notes';
      } else {
        fileType = 'pdf';
      }

      const fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      try {
        const aiRes = await fetch('/api/materials/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: fileName,
            fileName,
            fileType,
            courseName: selectedCourse?.name || 'General Course',
            textContent: `Document uploaded: ${fileName}.`,
            fileUrl: fileDataUrl.slice(0, 500),
          }),
        });
        const json = await aiRes.json();
        const aiData = json.data || {};

        const newMat: CourseMaterial = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          courseId: selectedCourse?.id || 'course-gen',
          courseName: selectedCourse?.name || 'General',
          linkedExamId: targetExam ? targetExam.id : undefined,
          linkedExamTitle: targetExam ? targetExam.name : undefined,
          title: aiData.title || fileName,
          fileName,
          fileType,
          fileSizeStr,
          pageCount: aiData.pageCount || 1,
          uploadedAt: new Date().toISOString(),
          topicsSummary: aiData.topicsSummary || ['Uploaded Study Material', 'Core Concepts'],
          chapterOutline: aiData.chapterOutline || [
            { title: 'Section 1: Overview', pageRange: 'Pages 1-10', summary: 'Core theory and concepts.' },
          ],
          keyFormulasAndConcepts: aiData.keyFormulasAndConcepts || [
            { concept: 'Key Formula', formulaOrRule: 'Standard Reference', description: 'Important course definition.' },
          ],
          practiceProblems: aiData.practiceProblems || ['Review uploaded notes and formulas.'],
          fileDataUrl,
        };
        onAddMaterial(newMat);
      } catch (e) {
        const fallbackMat: CourseMaterial = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          courseId: selectedCourse?.id || 'course-gen',
          courseName: selectedCourse?.name || 'General',
          linkedExamId: targetExam ? targetExam.id : undefined,
          linkedExamTitle: targetExam ? targetExam.name : undefined,
          title: fileName,
          fileName,
          fileType,
          fileSizeStr,
          pageCount: 1,
          uploadedAt: new Date().toISOString(),
          topicsSummary: ['Uploaded Material', 'Lecture File'],
          chapterOutline: [
            { title: 'Section 1: Overview', pageRange: 'Page 1', summary: 'Content stored.' },
          ],
          keyFormulasAndConcepts: [
            { concept: 'Direct Upload', formulaOrRule: fileName, description: 'File uploaded.' },
          ],
          practiceProblems: ['Review uploaded material.'],
          fileDataUrl,
        };
        onAddMaterial(fallbackMat);
      }
    }
    setIsUploading(false);
    setUploadStatusMessage('');
  };

  // Manual note creation
  const handleCreateManualNote = async () => {
    if (!noteTitle.trim()) return;
    setIsUploading(true);
    const selectedCourse = courses.find((c) => c.id === noteCourseId) || courses[0];
    const targetExam = examMilestones.find((t) => t.id === noteExamId);

    try {
      const res = await fetch('/api/materials/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle,
          fileName: `${noteTitle}.txt`,
          fileType: 'notes',
          courseName: selectedCourse?.name || 'General Course',
          textContent: noteContent || `Note on ${noteTitle}`,
        }),
      });

      const json = await res.json();
      const aiData = json.data || {};

      const newMat: CourseMaterial = {
        id: `mat-${Date.now()}`,
        courseId: selectedCourse?.id || 'course-gen',
        courseName: selectedCourse?.name || 'General',
        linkedExamId: targetExam ? targetExam.id : undefined,
        linkedExamTitle: targetExam ? targetExam.name : undefined,
        title: noteTitle,
        fileName: `${noteTitle}.txt`,
        fileType: 'notes',
        fileSizeStr: `${Math.max(1, Math.round(noteContent.length / 1024))} KB`,
        pageCount: aiData.pageCount || 1,
        uploadedAt: new Date().toISOString(),
        topicsSummary: aiData.topicsSummary || ['Key Lecture Notes', 'Core Principles'],
        chapterOutline: aiData.chapterOutline || [
          { title: 'Notes Overview', pageRange: 'Page 1', summary: noteContent.slice(0, 120) },
        ],
        keyFormulasAndConcepts: aiData.keyFormulasAndConcepts || [
          { concept: 'Key Takeaway', formulaOrRule: 'Formula/Rule', description: noteContent.slice(0, 100) },
        ],
        practiceProblems: aiData.practiceProblems || ['Review notes and core takeaways.'],
        fileDataUrl: 'pasted_text',
      };

      onAddMaterial(newMat);
    } catch (err) {
      const fallbackMat: CourseMaterial = {
        id: `mat-${Date.now()}`,
        courseId: selectedCourse?.id || 'course-gen',
        courseName: selectedCourse?.name || 'General',
        linkedExamId: targetExam ? targetExam.id : undefined,
        linkedExamTitle: targetExam ? targetExam.name : undefined,
        title: noteTitle,
        fileName: `${noteTitle}.txt`,
        fileType: 'notes',
        fileSizeStr: `${Math.max(1, Math.round(noteContent.length / 1024))} KB`,
        pageCount: 1,
        uploadedAt: new Date().toISOString(),
        topicsSummary: ['Study Note', 'Lecture Summary'],
        chapterOutline: [{ title: 'Overview', pageRange: 'Page 1', summary: noteContent.slice(0, 100) }],
        keyFormulasAndConcepts: [{ concept: 'Note Note', formulaOrRule: noteTitle, description: noteContent.slice(0, 80) }],
        practiceProblems: ['Review note topics.'],
        fileDataUrl: 'pasted_text',
      };
      onAddMaterial(fallbackMat);
    } finally {
      setIsUploading(false);
      setShowNoteModal(false);
      setNoteTitle('');
      setNoteContent('');
    }
  };

  // AI Chat inside Detail Modal
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !activeMaterial) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsAskingAI(true);

    try {
      const res = await fetch('/api/materials/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          materialContext: activeMaterial,
        }),
      });
      const json = await res.json();
      setChatMessages((prev) => [...prev, { sender: 'ai', text: json.answer || 'Here is what the document says...' }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Based on "${activeMaterial.title}", key principles include ${activeMaterial.topicsSummary.join(', ')}.` },
      ]);
    } finally {
      setIsAskingAI(false);
    }
  };

  // AI Quiz inside Detail Modal
  const handleGenerateQuiz = async () => {
    if (!activeMaterial) return;
    setIsGeneratingQuiz(true);
    setQuizSubmitted(false);
    setQuizAnswers({});

    try {
      const res = await fetch('/api/materials/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialContext: activeMaterial,
        }),
      });
      const json = await res.json();
      if (json.quiz && json.quiz.questions) {
        setActiveQuiz(json.quiz);
      }
    } catch (err) {
      // Fallback quiz
      setActiveQuiz({
        quizTitle: `Practice Quiz: ${activeMaterial.title}`,
        questions: [
          {
            id: 'q1',
            question: `What is the primary focus of ${activeMaterial.topicsSummary[0] || 'this chapter'}?`,
            options: [
              `Understanding fundamental rules of ${activeMaterial.courseName}`,
              'Storing energy in static magnetic fields',
              'Calculating basic arithmetic averages',
              'Designing web interfaces',
            ],
            correctOptionIndex: 0,
            explanation: `The material explicitly covers ${activeMaterial.topicsSummary[0]} as a foundational concept.`,
          },
          {
            id: 'q2',
            question: `Which formula or concept applies to ${activeMaterial.keyFormulasAndConcepts[0]?.concept || 'this topic'}?`,
            options: [
              activeMaterial.keyFormulasAndConcepts[0]?.formulaOrRule || 'E = mc²',
              'F = ma',
              'V = IR',
              'PV = nRT',
            ],
            correctOptionIndex: 0,
            explanation: `According to the indexed knowledge base, ${activeMaterial.keyFormulasAndConcepts[0]?.concept} uses ${activeMaterial.keyFormulasAndConcepts[0]?.formulaOrRule}.`,
          },
        ],
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Document-Grounded Knowledge Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Materials & Knowledge Base
            </h1>
            <p className="text-sm text-indigo-200/90 mt-1 max-w-2xl">
              Upload course PDFs, lecture slides, and notes. AI parses every document into chapter outlines, formula sheets, and grounded study sessions.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-xl font-bold text-white">{materials.length}</div>
              <div className="text-[11px] font-medium text-indigo-200 uppercase tracking-wider">Materials</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-xl font-bold text-emerald-300">{totalTopics}</div>
              <div className="text-[11px] font-medium text-indigo-200 uppercase tracking-wider">AI Topics</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-xl font-bold text-amber-300">{totalFormulas}</div>
              <div className="text-[11px] font-medium text-indigo-200 uppercase tracking-wider">Formulas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone & Actions Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop Upload Zone */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Upload & AI Index Material
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="upload-course-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Course:
                </label>
                <select
                  id="upload-course-select"
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} – {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="upload-exam-select" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Link Exam:
                </label>
                <select
                  id="upload-exam-select"
                  value={uploadExamId}
                  onChange={(e) => setUploadExamId(e.target.value)}
                  className="text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="none">-- General Material (No specific exam) --</option>
                  {examMilestones.map((t) => (
                    <option key={t.id} value={t.id}>
                      🎯 {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden">
            {isUploading ? (
              <div className="border-2 border-dashed border-indigo-400 dark:border-indigo-600 rounded-xl p-8 text-center bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col items-center justify-center py-6">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {uploadStatusMessage || 'AI Document Indexing in Progress...'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Parsing chapter outlines, formulas, and generating practice questions with Gemini AI.
                </p>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processFiles(Array.from(e.dataTransfer.files));
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-slate-50/60 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processFiles(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                  id="materials-page-file-input"
                />

                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    Drop course documents here or click to choose files
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Supports PDF, PPTX, DOCX, TXT (up to 32MB)
                  </p>
                </div>

                <button
                  type="button"
                  id="materials-choose-file-btn"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose & Upload File</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Paste Note Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Paste Text Notes</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Create AI-Indexed Study Note
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Don't have a file? Paste lecture summaries, textbook excerpts, or formula lists to generate instant AI topic indexing.
            </p>
          </div>

          <button
            onClick={() => setShowNoteModal(true)}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Paste Lecture Note</span>
          </button>
        </div>
      </div>

      {/* Course Filter Bar & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        {/* Course Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCourseId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedCourseId === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>All Courses</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
              {materials.length}
            </span>
          </button>

          {courses.map((course) => {
            const count = materials.filter((m) => m.courseId === course.id).length;
            const isSelected = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: course.accentHex || '#6366f1' }}
                ></span>
                <span>{course.code}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search materials, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs">
          <Library className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No materials found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Upload a syllabus, lecture slide, or textbook chapter above to start building your AI knowledge base.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((mat) => {
            const matchedCourse = courses.find((c) => c.id === mat.courseId);
            return (
              <div
                key={mat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Card Info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                        {mat.fileType === 'slides' ? (
                          <Layers className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider inline-block"
                            style={{ backgroundColor: matchedCourse?.accentHex || '#6366f1' }}
                          >
                            {matchedCourse?.code || mat.courseName || 'Course'}
                          </span>
                          {mat.linkedExamTitle && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 flex items-center gap-1 truncate max-w-[140px]" title={`Linked to ${mat.linkedExamTitle}`}>
                              🎯 {mat.linkedExamTitle}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {mat.pageCount ? `${mat.pageCount} Pages` : mat.fileSizeStr || '2.4 MB'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteMaterial(mat.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-base leading-snug mb-2 line-clamp-2">
                    {mat.title}
                  </h3>

                  {/* Exam Milestone Selector on Card */}
                  <div className="mb-3">
                    <select
                      value={mat.linkedExamId || 'none'}
                      onChange={(e) => {
                        const newExamId = e.target.value;
                        const linkedExam = examMilestones.find((t) => t.id === newExamId);
                        const updatedMat = {
                          ...mat,
                          linkedExamId: newExamId === 'none' ? undefined : newExamId,
                          linkedExamTitle: newExamId === 'none' ? undefined : linkedExam?.name,
                        };
                        onAddMaterial(updatedMat);
                      }}
                      className="text-[11px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="none">🔗 Link to Exam Milestone...</option>
                      {examMilestones.map((t) => (
                        <option key={t.id} value={t.id}>
                          🎯 {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AI Topics Badges */}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Extracted AI Topics
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mat.topicsSummary?.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700/60"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Formulas Preview Box */}
                  {mat.keyFormulasAndConcepts && mat.keyFormulasAndConcepts.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/50 mb-4">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5 text-amber-500" />
                        {mat.keyFormulasAndConcepts[0].concept}
                      </div>
                      <div className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 truncate">
                        {mat.keyFormulasAndConcepts[0].formulaOrRule || mat.keyFormulasAndConcepts[0].description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveMaterial(mat);
                      setChatMessages([]);
                      setActiveQuiz(null);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Outline</span>
                  </button>

                  {mat.fileDataUrl && mat.fileDataUrl.startsWith('http') && (
                    <a
                      href={mat.fileDataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                      title="Download/Open File"
                    >
                      <FileDown className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setActiveMaterial(mat);
                      setChatMessages([]);
                      setActiveQuiz(null);
                    }}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                    title="Ask Document AI"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}



      {/* Manual Paste Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Paste Lecture Note or Textbook Text
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Target Course
              </label>
              <select
                value={noteCourseId}
                onChange={(e) => setNoteCourseId(e.target.value)}
                className="w-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Note Title
              </label>
              <input
                type="text"
                placeholder="e.g., Chapter 4: Differential Equations Summary"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Text Content
              </label>
              <textarea
                rows={6}
                placeholder="Paste lecture notes, formulas, or study guides here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (noteTitle.trim()) {
                    handleCreateManualNote();
                  }
                }}
                disabled={!noteTitle.trim() || isUploading}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Index Note with AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Detail & Knowledge Base Modal */}
      {activeMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white inline-block mb-1">
                  {activeMaterial.courseName || 'Course Material'}
                </span>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                  {activeMaterial.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeMaterial.fileName} • {activeMaterial.pageCount || 24} Pages • Indexed on{' '}
                  {new Date(activeMaterial.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setActiveMaterial(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body Tabs */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Chapter Outline Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Chapter & Topic Outline
                </h3>
                <div className="space-y-2.5">
                  {activeMaterial.chapterOutline?.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{ch.title}</span>
                        {ch.pageRange && (
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md">
                            {ch.pageRange}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ch.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulas & Core Concepts Section */}
              {activeMaterial.keyFormulasAndConcepts && activeMaterial.keyFormulasAndConcepts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500" />
                    Key Formulas & Core Concepts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMaterial.keyFormulasAndConcepts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-800/40"
                      >
                        <div className="text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                          {item.concept}
                        </div>
                        {item.formulaOrRule && (
                          <div className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mb-1.5">
                            {item.formulaOrRule}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Problems Section */}
              {activeMaterial.practiceProblems && activeMaterial.practiceProblems.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Assigned Practice Exercises
                  </h3>
                  <ul className="space-y-2">
                    {activeMaterial.practiceProblems.map((prob, idx) => (
                      <li
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ask AI & Quiz Tabs */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Ask AI Tutor or Take Grounded Quiz
                  </h3>

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    {isGeneratingQuiz ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>Generate Practice Quiz</span>
                  </button>
                </div>

                {/* AI Quiz View */}
                {activeQuiz && (
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4">
                    <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                      {activeQuiz.quizTitle}
                    </h4>

                    {activeQuiz.questions.map((q, qIdx) => (
                      <div
                        key={q.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Q{qIdx + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = quizAnswers[q.id] === oIdx;
                            const isCorrect = q.correctOptionIndex === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                                disabled={quizSubmitted}
                                className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-colors ${
                                  quizSubmitted
                                    ? isCorrect
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-500 font-bold'
                                      : isSelected
                                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-500'
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
                                    : isSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 border-indigo-500 font-bold'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            💡 <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-end">
                      {!quizSubmitted ? (
                        <button
                          onClick={() => setQuizSubmitted(true)}
                          className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Submit Answers
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          🎉 Quiz completed!
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Chat Drawer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-2.5 pr-2">
                    {chatMessages.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                        Ask any question about {activeMaterial.title}. The AI will answer strictly grounded in this material.
                      </p>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-indigo-600 text-white font-medium rounded-br-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs rounded-bl-xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                    {isAskingAI && (
                      <div className="flex justify-start">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                          <span>AI Tutor is reading document...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Box */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Ask a question about ${activeMaterial.title}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      className="flex-1 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || isAskingAI}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
