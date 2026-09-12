import React, { useState, useMemo, useRef } from 'react';
import { Course, Task, CourseMaterial } from '../types';
import { safeCopyToClipboard } from '../utils/clipboard';
import { useAuth } from '../contexts/AuthContext';
import { saveMaterialToDb } from '../services/firestoreService';
import { useUploadThing } from '../utils/uploadthing';
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
  Upload,
  Loader2,
} from 'lucide-react';
import { calculateCourseGrade, getStatusBadgeConfig } from '../utils/gradeCalculator';
import { formatDeadlineRelative } from '../utils/smartPlanner';

interface CourseResourceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string | null;
  course?: Course | null;
  courses?: Course[];
  tasks: Task[];
  materials?: CourseMaterial[];
  onAddMaterial?: (material: CourseMaterial) => void;
}

export function CourseResourceHubModal({
  isOpen,
  onClose,
  courseId,
  course: propCourse,
  courses = [],
  tasks = [],
  materials = [],
  onAddMaterial,
}: CourseResourceHubModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'materials' | 'formulas' | 'upcoming' | 'results'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [sortBy, setSortBy] = useState<'Newest' | 'Alphabetical' | 'Task Deadline'>('Newest');
  const [localMaterials, setLocalMaterials] = useState<CourseMaterial[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Resolve course from courseId, courses list, or propCourse
  const course = useMemo(() => {
    if (propCourse) return propCourse;
    if (courseId && courses.length > 0) {
      return courses.find((c) => c.id === courseId) || null;
    }
    return propCourse || null;
  }, [propCourse, courseId, courses]);

  // Combine prop materials and newly uploaded materials
  const safeMaterials = useMemo(() => {
    const map = new Map<string, CourseMaterial>();
    (materials || []).forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    localMaterials.forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    return Array.from(map.values());
  }, [materials, localMaterials]);

  const safeTasks = tasks || [];

  // Handle client upload completion via Uploadthing
  const handleUploadComplete = async (res: any[]) => {
    if (!res || res.length === 0 || !course) {
      setIsUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setIsUploading(true);
    setUploadStatus('Saving uploaded file to course...');
    const userId = currentUser?.uid || 'usr_demo';

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

      const matId = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const title = fileName.replace(/\.[^/.]+$/, "");

      const newMat: CourseMaterial = {
        id: matId,
        courseId: course.id,
        courseName: course.name,
        title,
        fileName,
        fileType,
        fileSizeStr,
        pageCount: 1,
        uploadedAt: new Date().toISOString(),
        topicsSummary: ['Course Resource', 'Reference Document'],
        chapterOutline: [
          { title: 'Overview', pageRange: 'Page 1', summary: `Course attachment for ${course.name}.` },
        ],
        keyFormulasAndConcepts: [],
        practiceProblems: [],
        fileDataUrl: fileUrl,
      };

      // 1. Save directly to Firestore under users/{userId}/materials/{matId}
      await saveMaterialToDb(userId, newMat);

      // 2. Immediately update local state
      setLocalMaterials((prev) => [newMat, ...prev.filter((m) => m.id !== newMat.id)]);

      // 3. Notify parent
      if (onAddMaterial) {
        onAddMaterial(newMat);
      }

      // 4. Background AI indexing to extract topics and formulas if possible
      try {
        fetch('/api/materials/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newMat.title,
            fileName,
            fileType,
            courseName: course.name,
            textContent: `Course attachment uploaded for ${course.name}: ${fileName}. File URL: ${fileUrl}`,
            fileUrl,
          }),
        }).then(async (r) => {
          if (r.ok) {
            const json = await r.json();
            if (json.data) {
              const updatedMat: CourseMaterial = {
                ...newMat,
                topicsSummary: json.data.topicsSummary || newMat.topicsSummary,
                chapterOutline: json.data.chapterOutline || newMat.chapterOutline,
                keyFormulasAndConcepts: json.data.keyFormulasAndConcepts || newMat.keyFormulasAndConcepts,
                practiceProblems: json.data.practiceProblems || newMat.practiceProblems,
              };
              await saveMaterialToDb(userId, updatedMat);
              setLocalMaterials((prev) => [updatedMat, ...prev.filter((m) => m.id !== updatedMat.id)]);
              if (onAddMaterial) onAddMaterial(updatedMat);
            }
          }
        }).catch((err) => console.warn('Background AI indexing notice:', err));
      } catch (e) {
        // non-blocking
      }
    }

    setIsUploading(false);
    setUploadStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Uploadthing hook with explicit error diagnostics
  const { startUpload } = useUploadThing('courseAttachment', {
    onClientUploadComplete: (res) => {
      handleUploadComplete(res);
    },
    onUploadError: (error: Error) => {
      console.error('Detailed Uploadthing error in Course Resource Hub:', error);
      setIsUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  // Client file processor supporting Uploadthing with local fallback
  const processFiles = async (files: File[]) => {
    if (!files.length || !course) return;
    setIsUploading(true);
    setUploadStatus('Uploading & indexing course material...');

    try {
      // Attempt upload via Uploadthing helper
      const uploadRes = await startUpload(files);
      if (uploadRes && uploadRes.length > 0) {
        // onClientUploadComplete handles saving, so we just reset the input here
        // (handleUploadComplete will also reset it, but this ensures it's cleared if the callback is delayed)
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } catch (uploadError) {
      console.error('Uploadthing startUpload failed, executing fallback indexing:', uploadError);
    }

    // Direct client processing fallback to guarantee user files are never lost
    const userId = currentUser?.uid || 'usr_demo';
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

      // Read as Data URL or Text
      const fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      const matId = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const title = fileName.replace(/\.[^/.]+$/, "");

      const fallbackMat: CourseMaterial = {
        id: matId,
        courseId: course.id,
        courseName: course.name,
        title,
        fileName,
        fileType,
        fileSizeStr,
        pageCount: 1,
        uploadedAt: new Date().toISOString(),
        topicsSummary: ['Course Resource', 'Reference Document'],
        chapterOutline: [
          { title: 'Overview', pageRange: 'Page 1', summary: `Course attachment for ${course.name}.` },
        ],
        keyFormulasAndConcepts: [],
        practiceProblems: [],
        fileDataUrl,
      };

      await saveMaterialToDb(userId, fallbackMat);
      setLocalMaterials((prev) => [fallbackMat, ...prev.filter((m) => m.id !== fallbackMat.id)]);
      if (onAddMaterial) onAddMaterial(fallbackMat);

      // AI indexing in background
      try {
        fetch('/api/materials/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: fallbackMat.title,
            fileName,
            fileType,
            courseName: course.name,
            textContent: `Course attachment uploaded for ${course.name}: ${fileName}.`,
            fileUrl: fileDataUrl.slice(0, 500),
          }),
        }).then(async (r) => {
          if (r.ok) {
            const json = await r.json();
            if (json.data) {
              const updatedMat: CourseMaterial = {
                ...fallbackMat,
                topicsSummary: json.data.topicsSummary || fallbackMat.topicsSummary,
                chapterOutline: json.data.chapterOutline || fallbackMat.chapterOutline,
                keyFormulasAndConcepts: json.data.keyFormulasAndConcepts || fallbackMat.keyFormulasAndConcepts,
                practiceProblems: json.data.practiceProblems || fallbackMat.practiceProblems,
              };
              await saveMaterialToDb(userId, updatedMat);
              setLocalMaterials((prev) => [updatedMat, ...prev.filter((m) => m.id !== updatedMat.id)]);
              if (onAddMaterial) onAddMaterial(updatedMat);
            }
          }
        }).catch((err) => console.warn('AI Indexing notice:', err));
      } catch {}
    }

    setIsUploading(false);
    setUploadStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter materials for this course
  const courseMaterials = useMemo(() => {
    if (!course) return [];
    const courseNameLower = (course.name || '').toLowerCase();
    const filtered = safeMaterials.filter(
      (m) =>
        m &&
        (m.courseId === course.id ||
        (m.courseName && m.courseName.toLowerCase() === courseNameLower))
    );

    if (sortBy === 'Alphabetical') {
      return [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'Task Deadline') {
      return [...filtered].sort((a, b) => {
        const taskA = safeTasks.find((t) => t && t.id === a.linkedExamId);
        const taskB = safeTasks.find((t) => t && t.id === b.linkedExamId);
        if (taskA && taskB) {
          return new Date(taskA.deadline || 0).getTime() - new Date(taskB.deadline || 0).getTime();
        }
        if (taskA) return -1;
        if (taskB) return 1;
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      });
    } else {
      return [...filtered].sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
    }
  }, [safeMaterials, course, sortBy, safeTasks]);

  // Filter tasks for this course
  const courseTasks = useMemo(() => {
    if (!course) return [];
    return safeTasks.filter((t) => t && t.courseId === course.id);
  }, [safeTasks, course]);

  // Split into active upcoming vs completed graded quizzes/exams
  const activeUpcomingTasks = useMemo(() => {
    const list = courseTasks.filter((t) => t.status !== 'completed');
    if (sortBy === 'Alphabetical') {
      return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'Task Deadline') {
      return [...list].sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime());
    } else {
      return [...list].sort((a, b) => new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime());
    }
  }, [courseTasks, sortBy]);

  const pastQuizExamResults = useMemo(() => {
    const list = courseTasks.filter((t) => t.status === 'completed' && (t.type === 'Quiz' || t.type === 'Exam' || t.achievedGrade !== undefined));
    if (sortBy === 'Alphabetical') {
      return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'Task Deadline') {
      return [...list].sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime());
    } else {
      return [...list].sort((a, b) => new Date(b.completedAt || b.deadline || 0).getTime() - new Date(a.completedAt || a.deadline || 0).getTime());
    }
  }, [courseTasks, sortBy]);

  // Aggregate formulas across all course materials
  const aggregatedFormulas = useMemo(() => {
    if (!course) return [];
    const formulasList: {
      concept: string;
      formulaOrRule?: string;
      description: string;
      materialTitle: string;
      uploadedAt?: string;
    }[] = [];

    courseMaterials.forEach((mat) => {
      if (mat.keyFormulasAndConcepts && Array.isArray(mat.keyFormulasAndConcepts)) {
        mat.keyFormulasAndConcepts.forEach((f) => {
          if (f && f.concept) {
            formulasList.push({
              ...f,
              materialTitle: mat.title || 'Course Material',
              uploadedAt: mat.uploadedAt,
            });
          }
        });
      }
    });

    const cId = (course.id || '').toLowerCase();
    const cName = (course.name || '').toLowerCase();

    // Default fallbacks if no uploaded material formulas exist yet
    if (formulasList.length === 0) {
      if (cId.includes('calc') || cName.includes('calc')) {
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
      } else if (cId.includes('phys') || cName.includes('phys')) {
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
          concept: `${course.name || 'Core'} Key Concept 1`,
          formulaOrRule: 'Key Theorem / Core Formula',
          description: `Primary conceptual principle for ${course.name || 'this course'}.`,
          materialTitle: 'General Course Syllabus',
        });
      }
    }

    let filtered = formulasList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = formulasList.filter(
        (item) =>
          (item.concept || '').toLowerCase().includes(q) ||
          (item.formulaOrRule && item.formulaOrRule.toLowerCase().includes(q)) ||
          (item.description || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'Alphabetical') {
      return [...filtered].sort((a, b) => (a.concept || '').localeCompare(b.concept || ''));
    } else if (sortBy === 'Task Deadline') {
      return filtered;
    } else {
      return [...filtered].sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      });
    }
  }, [courseMaterials, course, searchQuery, sortBy]);

  // Academic Grade Summary
  const gradeSummary = useMemo(() => {
    if (!course) {
      return {
        hasGrades: false,
        percentage: 0,
        percentageFormatted: 'N/A',
        totalAchievedPoints: 0,
        totalPossiblePoints: 0,
        gradedCount: 0,
        pendingCount: 0,
        letterGrade: '—',
        statusBadge: 'On Track' as const,
        requiresRemediation: false,
        totalWeightRecorded: 0,
      };
    }
    return calculateCourseGrade(course.id, tasks);
  }, [course, tasks]);

  const badgeConfig = useMemo(() => {
    return getStatusBadgeConfig(gradeSummary.statusBadge);
  }, [gradeSummary]);

  if (!isOpen) return null;

  if (!course) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
            <BookOpen className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
            Loading Resource Hub...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please wait while we gather materials and synthesize concepts for your course.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMaterial = (mat: CourseMaterial) => {
    if (mat.fileDataUrl && (mat.fileDataUrl.startsWith('http') || mat.fileDataUrl.startsWith('data:'))) {
      const a = document.createElement('a');
      a.href = mat.fileDataUrl;
      a.download = mat.fileName || `${mat.title || 'material'}.pdf`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `# ${mat.title || 'Course Material'}\nCourse: ${mat.courseName || course.name}\nType: ${mat.fileType}\nUploaded: ${mat.uploadedAt || ''}\n\n## Topics Summary\n${(mat.topicsSummary || []).map(t => `- ${t}`).join('\n')}\n\n## Chapter Outline\n${(mat.chapterOutline || []).map(c => `### ${c.title} (${c.pageRange || ''})\n${c.summary || ''}`).join('\n\n')}\n\n## Key Formulas & Concepts\n${(mat.keyFormulasAndConcepts || []).map(f => `### ${f.concept}\nFormula: ${f.formulaOrRule || ''}\n${f.description || ''}`).join('\n\n')}\n\n## Practice Problems\n${(mat.practiceProblems || []).map(p => `- ${p}`).join('\n')}`;
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(mat.fileName || mat.title || 'material').replace(/\.[^/.]+$/, "")}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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

          {/* Sorting Controls Bar */}
          <div className="no-print bg-slate-50 dark:bg-slate-900/30 px-6 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Customize the view order of materials, formulas, and upcoming tasks:
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="resource-sort-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">Sort order:</label>
              <select
                id="resource-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="Newest">Newest</option>
                <option value="Alphabetical">Alphabetical</option>
                <option value="Task Deadline">Task Deadline</option>
              </select>
            </div>
          </div>

          {/* Printable Body Container */}
          <div
            id="printable-course-resource-hub"
            className="p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[calc(92vh-220px)]"
          >
            {/* SECTION 1: MATERIALS & LECTURES */}
            {(activeTab === 'all' || activeTab === 'materials') && (
              <section id="hub-section-materials" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Course Materials & Syllabus Guides</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Upload PDFs, lecture slides, formulas, and syllabus notes for {course.name}.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {courseMaterials.length} Documents
                  </span>
                </div>

                {/* Uploadthing Uploader for Course Materials */}
                <div className="no-print bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Add Attachment to {course.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Supports .pdf, .docx, .pptx, .txt (up to 32MB)
                        </p>
                      </div>
                    </div>

                    {isUploading && (
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{uploadStatus || 'Uploading & indexing...'}</span>
                      </div>
                    )}
                  </div>

                  {/* Drag and Drop Container with direct File Input & Choose File button */}
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
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3 ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
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
                      id="course-hub-file-input"
                    />

                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Drop course syllabus, slides, or PDF notes here
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Accepts PDF, DOCX, PPTX, TXT (up to 32MB)
                      </p>
                    </div>

                    <button
                      type="button"
                      id="choose-course-attachment-btn"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose File to Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {courseMaterials.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                    <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No materials uploaded for {course.name} yet.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Upload your syllabus, lecture slides, or readings using the uploader above to auto-extract concepts and formulas.
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

                          <button
                            type="button"
                            id={`download-mat-btn-${mat.id}`}
                            onClick={() => handleDownloadMaterial(mat)}
                            className="no-print p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                            title="Download material"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="hidden sm:inline text-[11px]">Download</span>
                          </button>
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
