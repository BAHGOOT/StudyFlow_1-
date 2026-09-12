export type TaskType = 'Assignment' | 'Quiz' | 'Exam' | 'Project' | 'Study' | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Course {
  id: string;
  name: string;
  code: string;
  professor?: string;
  color: string; // Tailwind color theme identifier (e.g., 'indigo', 'blue', 'amber', 'emerald', 'violet', 'rose')
  accentHex: string;
  credits?: number;
  icon?: string;
}

export interface Task {
  id: string;
  name: string;
  courseId: string;
  type: TaskType;
  deadline: string; // YYYY-MM-DD or ISO string
  estimatedMinutes: number;
  importance: number; // 1 to 5
  difficulty: number; // 1 to 5
  notes?: string;
  status: TaskStatus;
  completedAt?: string;
  smartPriorityScore: number;
  urgencyReason?: string;
  // Context-grounded task details
  materialId?: string;
  materialTitle?: string;
  exactReading?: string; // e.g. "Pages 142–158 in Manufacturing Tech Vol. 2"
  targetOutcome?: string; // e.g. "By the end of this session, you will master 2nd order ODEs"
  exerciseTarget?: string; // e.g. "Problems 12–18 on Page 155"
  keyConceptsList?: string[];
  // Grade tracking & performance fields
  maxGrade?: number; // e.g., 20 or 100
  weightPercentage?: number; // e.g., 15 (%)
  achievedGrade?: number; // e.g., 14
  isRemedial?: boolean; // Flag for targeted remedial session
  remedialSourceExamId?: string;
  remedialSourceExamName?: string;
  conceptMasteryStatus?: 'Mastered' | 'Requires Remediation' | 'Pending';
}

export interface MaterialOutlineTopic {
  title: string;
  pageRange?: string; // e.g. "Pages 42–58"
  summary: string;
}

export interface MaterialFormulaConcept {
  concept: string;
  formulaOrRule?: string;
  description: string;
}

export interface CourseMaterial {
  id: string;
  userId?: string;
  courseId: string;
  courseName?: string;
  linkedExamId?: string; // Optional link to specific Exam/Quiz task
  linkedExamTitle?: string; // Title of linked Exam/Quiz milestone
  title: string;
  fileName: string;
  fileType: 'pdf' | 'slides' | 'syllabus' | 'notes' | 'doc';
  fileSizeStr?: string;
  pageCount?: number;
  uploadedAt: string; // ISO string
  topicsSummary: string[];
  chapterOutline: MaterialOutlineTopic[];
  keyFormulasAndConcepts: MaterialFormulaConcept[];
  practiceProblems: string[];
  fileDataUrl?: string; // Stored content for document Q&A
}

export interface TodayPlanItem {
  id: string;
  taskId: string;
  timeSlot: string; // e.g., "09:00", "10:00", "17:00"
  durationMinutes: number;
  completed: boolean;
}

export interface PlannedSession {
  id: string;
  taskId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot?: string;
  durationMinutes: number;
  completed: boolean;
}

export interface StudyAvailability {
  dailyHours: {
    Monday: number;
    Tuesday: number;
    Wednesday: number;
    Thursday: number;
    Friday: number;
    Saturday: number;
    Sunday: number;
  };
  preferredTime: 'Morning' | 'Afternoon' | 'Evening';
  commuteToMinutes?: number;
  commuteFromMinutes?: number;
}

export interface CollegeLecture {
  id: string;
  courseId?: string;
  courseName: string;
  courseCode?: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "11:00"
  location?: string; // e.g., "Hall B-102"
}

export interface CollegeCommute {
  commuteToCollegeMinutes: number;
  commuteFromCollegeMinutes: number;
}

export type StudentProfile = {
  name: string;
  major: string;
  year: string;
  semester: string;
  tier: string;
  email: string;
  role?: 'admin' | 'student';
  coins?: number;
  streakDays?: number;
};

export type TreeSpecies =
  | 'Oak'
  | 'Pine'
  | 'Birch'
  | 'Bonsai'
  | 'Cherry Blossom'
  | 'Maple'
  | 'Golden Ginkgo'
  | 'Willow'
  | 'Redwood';

export interface TreeSpeciesInfo {
  id: TreeSpecies;
  name: string;
  description: string;
  price: number; // 0 for free (only 3 are free)
  isFree: boolean;
  category: 'starter' | 'exotic' | 'legendary';
}

export interface PlantedTree {
  id: string;
  taskId: string;
  taskName: string;
  courseId: string;
  courseName: string;
  courseColor: string;
  species: TreeSpecies;
  focusMinutes: number;
  plantedAt: string; // ISO string
  weekNumber: number; // Semester week (e.g., 1, 2, 3)
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  month: string; // 'Jan', 'Feb', etc.
  status: 'bloomed' | 'healthy' | 'withered';
}

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export type NavScreen =
  | 'dashboard'
  | 'tasks'
  | 'courses'
  | 'materials'
  | 'planner'
  | 'forest'
  | 'store'
  | 'progress'
  | 'settings';

export interface CapturedNote {
  id: string;
  content: string;
  courseId?: string;
  courseName?: string;
  courseColor?: string;
  materialId?: string;
  materialTitle?: string;
  createdAt: string; // ISO string or relative time
  isConvertedToTask?: boolean;
  convertedTaskId?: string;
  tags?: string[];
}

