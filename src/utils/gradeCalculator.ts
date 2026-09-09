import { Task, Course, CourseMaterial } from '../types';

export interface CourseGradeSummary {
  hasGrades: boolean;
  percentage: number; // 0 to 100
  percentageFormatted: string; // e.g. "87.5%"
  totalAchievedPoints: number;
  totalPossiblePoints: number;
  gradedCount: number;
  pendingCount: number;
  letterGrade: string; // 'A+', 'A', 'B', etc.
  statusBadge: 'Excellence' | 'On Track' | 'Needs Review';
  requiresRemediation: boolean;
  totalWeightRecorded: number;
}

/**
 * Calculates a course's running percentage and performance status from graded tasks.
 */
export function calculateCourseGrade(courseId: string, tasks: Task[]): CourseGradeSummary {
  const courseTasks = tasks.filter((t) => t.courseId === courseId);
  
  // Graded tasks: must have maxGrade > 0 and achievedGrade != null
  const gradedTasks = courseTasks.filter(
    (t) => typeof t.maxGrade === 'number' && t.maxGrade > 0 && typeof t.achievedGrade === 'number'
  );

  // Pending graded items: has maxGrade but no achievedGrade yet
  const pendingTasks = courseTasks.filter(
    (t) => typeof t.maxGrade === 'number' && t.maxGrade > 0 && typeof t.achievedGrade !== 'number'
  );

  if (gradedTasks.length === 0) {
    return {
      hasGrades: false,
      percentage: 0,
      percentageFormatted: 'N/A',
      totalAchievedPoints: 0,
      totalPossiblePoints: 0,
      gradedCount: 0,
      pendingCount: pendingTasks.length,
      letterGrade: '—',
      statusBadge: 'On Track',
      requiresRemediation: false,
      totalWeightRecorded: 0,
    };
  }

  let totalAchieved = 0;
  let totalPossible = 0;
  let weightedPointsSum = 0;
  let totalWeight = 0;
  let hasWeights = false;

  for (const t of gradedTasks) {
    const achieved = Math.max(0, t.achievedGrade || 0);
    const max = Math.max(1, t.maxGrade || 1);
    totalAchieved += achieved;
    totalPossible += max;

    if (typeof t.weightPercentage === 'number' && t.weightPercentage > 0) {
      hasWeights = true;
      weightedPointsSum += (achieved / max) * t.weightPercentage;
      totalWeight += t.weightPercentage;
    }
  }

  let finalPercentage = 0;
  if (hasWeights && totalWeight > 0) {
    finalPercentage = Math.round((weightedPointsSum / totalWeight) * 1000) / 10;
  } else if (totalPossible > 0) {
    finalPercentage = Math.round((totalAchieved / totalPossible) * 1000) / 10;
  }

  const letterGrade = getLetterGrade(finalPercentage);
  let statusBadge: 'Excellence' | 'On Track' | 'Needs Review' = 'On Track';
  let requiresRemediation = false;

  if (finalPercentage >= 90) {
    statusBadge = 'Excellence';
  } else if (finalPercentage >= 80) {
    statusBadge = 'On Track';
  } else {
    statusBadge = 'Needs Review';
    requiresRemediation = true;
  }

  return {
    hasGrades: true,
    percentage: finalPercentage,
    percentageFormatted: `${finalPercentage.toFixed(1)}%`,
    totalAchievedPoints: Math.round(totalAchieved * 10) / 10,
    totalPossiblePoints: Math.round(totalPossible * 10) / 10,
    gradedCount: gradedTasks.length,
    pendingCount: pendingTasks.length,
    letterGrade,
    statusBadge,
    requiresRemediation,
    totalWeightRecorded: totalWeight,
  };
}

/**
 * Returns letter grade based on percentage score
 */
export function getLetterGrade(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 65) return 'D+';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Returns color styles and label for the grade status badge
 */
export function getStatusBadgeConfig(badge: 'Excellence' | 'On Track' | 'Needs Review') {
  switch (badge) {
    case 'Excellence':
      return {
        label: 'Excellence',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
        progressBarClass: 'bg-emerald-500',
      };
    case 'On Track':
      return {
        label: 'On Track',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
        dotClass: 'bg-indigo-500',
        progressBarClass: 'bg-indigo-600',
      };
    case 'Needs Review':
      return {
        label: 'Needs Review',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
        dotClass: 'bg-rose-500',
        progressBarClass: 'bg-rose-500',
      };
  }
}

/**
 * Generates 1–2 targeted remedial review & practice problem tasks
 * when a student achieves a score < 80% on an exam/quiz.
 */
export function generateRemedialTasksForExam(
  examTask: Task,
  course: Course,
  materials: CourseMaterial[] = []
): Task[] {
  const courseMats = materials.filter(
    (m) => m.courseId === course.id || (m.courseName && m.courseName.toLowerCase() === course.name.toLowerCase())
  );
  const primaryMat = courseMats[0];

  // Schedule remedial tasks 1 to 2 days ahead
  const d1 = new Date();
  d1.setDate(d1.getDate() + 1);
  const yyyy1 = d1.getFullYear();
  const mm1 = String(d1.getMonth() + 1).padStart(2, '0');
  const dd1 = String(d1.getDate()).padStart(2, '0');
  const deadline1 = `${yyyy1}-${mm1}-${dd1}T21:00`;

  const d2 = new Date();
  d2.setDate(d2.getDate() + 2);
  const yyyy2 = d2.getFullYear();
  const mm2 = String(d2.getMonth() + 1).padStart(2, '0');
  const dd2 = String(d2.getDate()).padStart(2, '0');
  const deadline2 = `${yyyy2}-${mm2}-${dd2}T21:00`;

  const task1: Task = {
    id: `remedial-review-${examTask.id}-${Date.now()}`,
    courseId: course.id,
    name: `Remedial Concept Review - ${examTask.name}`,
    type: 'Study',
    deadline: deadline1,
    estimatedMinutes: 50,
    importance: 5,
    difficulty: 4,
    notes: `Remedial Review: Focus on weaker topics from ${examTask.name} to boost course grade.`,
    status: 'todo',
    smartPriorityScore: 92,
    urgencyReason: `Remedial session scheduled to address score on ${examTask.name}.`,
    isRemedial: true,
    remedialSourceExamId: examTask.id,
    remedialSourceExamName: examTask.name,
    targetOutcome: `Remedial Review: Focus on weaker topics from ${examTask.name} to boost course grade.`,
    exactReading: primaryMat
      ? `Review missed concepts & chapters in ${primaryMat.title}`
      : `Lecture notes & core textbook chapters for ${course.name}`,
    exerciseTarget: primaryMat?.practiceProblems?.[0] || `Re-solve missed problems from ${examTask.name}`,
    keyConceptsList: primaryMat?.topicsSummary?.slice(0, 3) || ['Error Analysis', 'Core Formula Review'],
    conceptMasteryStatus: 'Requires Remediation',
  };

  const task2: Task = {
    id: `remedial-practice-${examTask.id}-${Date.now() + 1}`,
    courseId: course.id,
    name: `Remedial Practice Problems - ${examTask.name}`,
    type: 'Assignment',
    deadline: deadline2,
    estimatedMinutes: 60,
    importance: 4,
    difficulty: 4,
    notes: `Targeted problem-solving session to reinforce core concepts from ${examTask.name}.`,
    status: 'todo',
    smartPriorityScore: 86,
    urgencyReason: `Active practice problem session following ${examTask.name} review.`,
    isRemedial: true,
    remedialSourceExamId: examTask.id,
    remedialSourceExamName: examTask.name,
    targetOutcome: `Solve at least 5 targeted practice exercises to achieve mastery for ${course.name}.`,
    exactReading: primaryMat ? `Worked examples in ${primaryMat.title}` : `Study guide exercises`,
    exerciseTarget: `Complete 5–8 targeted drill questions for ${course.code}`,
    keyConceptsList: ['Problem Solving', 'Application Drills'],
    conceptMasteryStatus: 'Requires Remediation',
  };

  return [task1, task2];
}
