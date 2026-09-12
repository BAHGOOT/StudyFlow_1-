import { Course, Task } from '../types';

export interface CourseGradeProjection {
  course: Course;
  credits: number;
  gradedTasks: Task[];
  ungradedTasks: Task[];
  totalGradedWeight: number; // Sum of weight% of graded tasks
  earnedWeight: number; // Total points earned towards 100% course grade
  currentAveragePct: number | null; // Current average percentage on graded work
  remainingWeight: number; // Total weight% of remaining ungraded work
  targetCoursePct: number; // Target course percentage needed to reach target GPA
  requiredRemainingPct: number | null; // Average % required on remaining tasks
  feasibilityStatus: 'secured' | 'achievable' | 'stretch' | 'unattainable';
  simulatedCoursePct: number | null;
  simulatedLetterGrade: string | null;
  simulatedGpaPoints: number | null;
}

export interface SemesterGradeProjection {
  targetGpa: number;
  targetSemesterPct: number;
  currentEstimatedGpa: number | null;
  projectedGpa: number | null;
  totalCredits: number;
  overallFeasibility: 'secured' | 'achievable' | 'stretch' | 'unattainable';
  courseProjections: CourseGradeProjection[];
  upcomingExamsCount: number;
}

/**
 * Maps GPA points (0.0 to 4.0) to equivalent percentage score in a course.
 */
export function gpaToPercentage(gpa: number): number {
  if (gpa >= 4.0) return 93.0;
  if (gpa >= 3.7) return 87.0 + (gpa - 3.7) * (6.0 / 0.3); // 87 to 93
  if (gpa >= 3.3) return 80.0 + (gpa - 3.3) * (7.0 / 0.4); // 80 to 87
  if (gpa >= 3.0) return 75.0 + (gpa - 3.0) * (5.0 / 0.3); // 75 to 80
  if (gpa >= 2.7) return 70.0 + (gpa - 2.7) * (5.0 / 0.3); // 70 to 75
  if (gpa >= 2.0) return 60.0 + (gpa - 2.0) * (10.0 / 0.7); // 60 to 70
  return Math.max(0, gpa * 30);
}

/**
 * Maps percentage score (0-100%) to GPA points (0.0 - 4.0).
 */
export function percentageToGpa(pct: number): number {
  if (pct >= 93) return 4.0;
  if (pct >= 90) return 3.7 + (pct - 90) * (0.3 / 3);
  if (pct >= 87) return 3.3 + (pct - 87) * (0.4 / 3);
  if (pct >= 83) return 3.0 + (pct - 83) * (0.3 / 4);
  if (pct >= 80) return 2.7 + (pct - 80) * (0.3 / 3);
  if (pct >= 77) return 2.3 + (pct - 77) * (0.4 / 3);
  if (pct >= 73) return 2.0 + (pct - 73) * (0.3 / 4);
  if (pct >= 65) return 1.5 + (pct - 65) * (0.5 / 8);
  if (pct >= 60) return 1.0 + (pct - 60) * (0.5 / 5);
  return 0.0;
}

/**
 * Returns letter grade string for a percentage score.
 */
export function percentageToLetterGrade(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 60) return 'D';
  return 'F';
}

/**
 * Infers default weight percentage for a task based on its type if not explicitly set.
 */
export function getTaskWeight(task: Task): number {
  if (typeof task.weightPercentage === 'number' && task.weightPercentage > 0) {
    return task.weightPercentage;
  }
  switch (task.type) {
    case 'Exam':
      return 25;
    case 'Project':
      return 20;
    case 'Quiz':
      return 15;
    case 'Assignment':
      return 10;
    case 'Study':
    case 'Other':
    default:
      return 5;
  }
}

/**
 * Calculates grade projection metrics for all courses and overall semester GPA based on target GPA.
 */
export function calculateSemesterGradeProjection(
  courses: Course[],
  tasks: Task[],
  targetGpa: number = 3.8,
  simulatedScores: Record<string, number> = {}
): SemesterGradeProjection {
  const targetSemesterPct = gpaToPercentage(targetGpa);
  let totalCredits = 0;
  let currentGpaWeightedSum = 0;
  let currentGradedCredits = 0;

  let simulatedGpaWeightedSum = 0;
  let simulatedGradedCredits = 0;

  let upcomingExamsCount = 0;

  const courseProjections: CourseGradeProjection[] = courses.map((course) => {
    const credits = course.credits || 3;
    totalCredits += credits;

    const courseTasks = tasks.filter((t) => t.courseId === course.id);
    const gradedTasks = courseTasks.filter(
      (t) => typeof t.achievedGrade === 'number' && t.achievedGrade >= 0
    );
    const ungradedTasks = courseTasks.filter(
      (t) => typeof t.achievedGrade !== 'number' || t.achievedGrade < 0
    );

    upcomingExamsCount += ungradedTasks.filter(
      (t) => t.type === 'Exam' || t.type === 'Quiz' || t.type === 'Project'
    ).length;

    // Calculate graded weight and earned points
    let totalGradedWeight = 0;
    let earnedWeight = 0;

    gradedTasks.forEach((t) => {
      const weight = getTaskWeight(t);
      const maxG = t.maxGrade || 100;
      const pct = Math.min(100, Math.max(0, ((t.achievedGrade ?? 0) / maxG) * 100));
      totalGradedWeight += weight;
      earnedWeight += (pct / 100) * weight;
    });

    const currentAveragePct =
      totalGradedWeight > 0 ? (earnedWeight / totalGradedWeight) * 100 : null;

    if (currentAveragePct !== null) {
      const courseCurrentGpa = percentageToGpa(currentAveragePct);
      currentGpaWeightedSum += courseCurrentGpa * credits;
      currentGradedCredits += credits;
    }

    // Remaining weight
    const remainingWeight = Math.max(0, 100 - totalGradedWeight);
    const targetCoursePct = targetSemesterPct;

    // Required remaining % to hit targetCoursePct
    let requiredRemainingPct: number | null = null;
    let feasibilityStatus: 'secured' | 'achievable' | 'stretch' | 'unattainable' = 'achievable';

    if (remainingWeight <= 0) {
      requiredRemainingPct = null;
      if (earnedWeight >= targetCoursePct) {
        feasibilityStatus = 'secured';
      } else {
        feasibilityStatus = 'unattainable';
      }
    } else {
      const pointsNeeded = targetCoursePct - earnedWeight;
      if (pointsNeeded <= 0) {
        requiredRemainingPct = 0;
        feasibilityStatus = 'secured';
      } else {
        const reqPct = (pointsNeeded / remainingWeight) * 100;
        requiredRemainingPct = Math.round(reqPct * 10) / 10;

        if (reqPct <= 100) {
          feasibilityStatus = 'achievable';
        } else if (reqPct <= 105) {
          feasibilityStatus = 'stretch';
        } else {
          feasibilityStatus = 'unattainable';
        }
      }
    }

    // Calculate simulated course percentage
    let simulatedEarnedWeight = earnedWeight;
    let simulatedTotalWeight = totalGradedWeight;

    ungradedTasks.forEach((t) => {
      const weight = getTaskWeight(t);
      // Use simulated score if specified, otherwise fall back to required remaining pct or 85% default
      const simPct =
        simulatedScores[t.id] !== undefined
          ? simulatedScores[t.id]
          : requiredRemainingPct !== null && requiredRemainingPct >= 0 && requiredRemainingPct <= 100
          ? requiredRemainingPct
          : 85;

      simulatedEarnedWeight += (simPct / 100) * weight;
      simulatedTotalWeight += weight;
    });

    const simulatedCoursePct =
      simulatedTotalWeight > 0
        ? Math.round((simulatedEarnedWeight / Math.min(100, Math.max(1, simulatedTotalWeight))) * 1000) / 10
        : null;

    const simulatedGpaPoints = simulatedCoursePct !== null ? percentageToGpa(simulatedCoursePct) : null;
    const simulatedLetterGrade = simulatedCoursePct !== null ? percentageToLetterGrade(simulatedCoursePct) : null;

    if (simulatedGpaPoints !== null) {
      simulatedGpaWeightedSum += simulatedGpaPoints * credits;
      simulatedGradedCredits += credits;
    }

    return {
      course,
      credits,
      gradedTasks,
      ungradedTasks,
      totalGradedWeight: Math.round(totalGradedWeight * 10) / 10,
      earnedWeight: Math.round(earnedWeight * 10) / 10,
      currentAveragePct: currentAveragePct !== null ? Math.round(currentAveragePct * 10) / 10 : null,
      remainingWeight: Math.round(remainingWeight * 10) / 10,
      targetCoursePct: Math.round(targetCoursePct * 10) / 10,
      requiredRemainingPct,
      feasibilityStatus,
      simulatedCoursePct,
      simulatedLetterGrade,
      simulatedGpaPoints: simulatedGpaPoints !== null ? Math.round(simulatedGpaPoints * 100) / 100 : null,
    };
  });

  const currentEstimatedGpa =
    currentGradedCredits > 0
      ? Math.round((currentGpaWeightedSum / currentGradedCredits) * 100) / 100
      : null;

  const projectedGpa =
    simulatedGradedCredits > 0
      ? Math.round((simulatedGpaWeightedSum / simulatedGradedCredits) * 100) / 100
      : null;

  // Determine overall semester feasibility
  let overallFeasibility: 'secured' | 'achievable' | 'stretch' | 'unattainable' = 'achievable';
  const unattainableCourses = courseProjections.filter((cp) => cp.feasibilityStatus === 'unattainable');
  const stretchCourses = courseProjections.filter((cp) => cp.feasibilityStatus === 'stretch');
  const securedCourses = courseProjections.filter((cp) => cp.feasibilityStatus === 'secured');

  if (unattainableCourses.length > 0) {
    overallFeasibility = 'unattainable';
  } else if (stretchCourses.length > 0) {
    overallFeasibility = 'stretch';
  } else if (securedCourses.length === courseProjections.length && courseProjections.length > 0) {
    overallFeasibility = 'secured';
  } else {
    overallFeasibility = 'achievable';
  }

  return {
    targetGpa,
    targetSemesterPct: Math.round(targetSemesterPct * 10) / 10,
    currentEstimatedGpa,
    projectedGpa,
    totalCredits,
    overallFeasibility,
    courseProjections,
    upcomingExamsCount,
  };
}
