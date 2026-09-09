import {
  Task,
  Course,
  TodayPlanItem,
  StudyAvailability,
  PlannedSession,
  CollegeLecture,
  CollegeCommute,
  CourseMaterial,
} from '../types';

/**
 * Calculates a 0-100 Smart Priority Score based on urgency (deadline proximity), difficulty level, course credit hours, and task importance.
 * Higher credit subjects, urgent deadlines, and high-difficulty tasks receive proportional score boosts.
 */
export function calculateSmartPriority(
  task: Partial<Task>,
  currentDate: Date = new Date(),
  course?: Course
): { score: number; reason: string } {
  const importance = task.importance || 3;
  const difficulty = task.difficulty || 3;
  const deadlineStr = task.deadline || '2026-09-12T23:59';
  const deadline = new Date(deadlineStr);
  const now = currentDate.getTime();
  const diffHours = Math.max(0, (deadline.getTime() - now) / (1000 * 60 * 60));

  let deadlineScore = 15;
  let reason = 'Balanced progress towards upcoming semester milestones.';

  if (diffHours <= 12) {
    deadlineScore = 50;
    reason = `Urgent deadline in ${Math.round(diffHours)}h! Immediate focus required.`;
  } else if (diffHours <= 24) {
    deadlineScore = 42;
    reason = `Due in ${Math.round(diffHours)}h. High urgency priority window.`;
  } else if (diffHours <= 48) {
    deadlineScore = 34;
    reason = `Due in 2 days — high priority to avoid last-minute workload rush.`;
  } else if (diffHours <= 96) {
    deadlineScore = 26;
    reason = `Due in ${Math.ceil(diffHours / 24)} days. Early preparation prevents backlog accumulation.`;
  } else if (diffHours <= 168) {
    deadlineScore = 18;
    reason = `Scheduled within this week to distribute cognitive workload evenly.`;
  } else {
    deadlineScore = 10;
    reason = `Longer-term milestone scheduled based on course credit weight and difficulty.`;
  }

  if (task.type === 'Exam' || task.type === 'Quiz') {
    reason = `High-stakes evaluation approaching; consistent review boosts retention.`;
  } else if (task.type === 'Project' && diffHours <= 168) {
    reason = `Multi-stage project requiring focused development blocks this week.`;
  }

  // Factor in course credit hours: higher credit subjects demand deeper priority (up to 18 points)
  const credits = course?.credits || 3;
  const creditWeight = Math.min(18, Math.round((credits / 3) * 9));

  // Importance score: 1-5 scale -> up to 20 points
  const importanceScore = (importance / 5) * 20;

  // Difficulty score: 1-5 scale -> up to 16 points
  const difficultyScore = (difficulty / 5) * 16;

  // Evaluation Type Bonus (+10 for Quizzes & Exams)
  const typeBonus = (task.type === 'Exam' || task.type === 'Quiz') ? 10 : 0;

  const rawScore = Math.min(99, Math.round(deadlineScore + importanceScore + difficultyScore + creditWeight + typeBonus));

  return { score: rawScore, reason };
}

/**
 * Detects if a task or course represents a heavy analytical subject
 * (e.g., Mathematics, Physics, Chemistry, Computer Science, Engineering, Statistics, Finance, high difficulty / credits)
 */
export function isHeavyAnalyticalTask(task: Task, course?: Course): boolean {
  if (task.difficulty >= 4) return true;
  if ((course?.credits || 0) >= 4) return true;
  if (task.type === 'Exam' || task.type === 'Quiz') return true;

  const textToCheck = `${course?.name || ''} ${course?.code || ''} ${task.name}`.toLowerCase();
  const analyticalKeywords = [
    'math', 'calculus', 'algebra', 'physics', 'chem', 'stat', 'computer', 'code',
    'algo', 'data', 'finance', 'accounting', 'eng', 'micro', 'macro', 'logic',
    'linear', 'prob', 'diff', 'discrete', 'mechanics', 'circuit', 'biochem',
    'genetics', 'analyt', 'econom', 'numerical'
  ];

  return analyticalKeywords.some((kw) => textToCheck.includes(kw));
}

/**
 * Returns the highest priority uncompleted task for "DO THIS NOW"
 */
export function getDoThisNowTask(tasks: Task[], skippedTaskIds: string[] = []): Task | null {
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  if (activeTasks.length === 0) return null;

  // Filter out skipped tasks first
  const unskipped = activeTasks.filter((t) => !skippedTaskIds.includes(t.id));
  const pool = unskipped.length > 0 ? unskipped : activeTasks;

  // Sort by smartPriorityScore descending, then earliest deadline
  const sorted = [...pool].sort((a, b) => {
    if (b.smartPriorityScore !== a.smartPriorityScore) {
      return b.smartPriorityScore - a.smartPriorityScore;
    }
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return sorted[0] || null;
}

/**
 * Computes today's study capacity
 */
export function getTodayCapacityMetrics(
  todayPlan: TodayPlanItem[],
  availability: StudyAvailability,
  dayOfWeek?: keyof StudyAvailability['dailyHours']
) {
  const currentDayName = (dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' })) as keyof StudyAvailability['dailyHours'];
  const availableHours = availability.dailyHours[currentDayName] ?? 3;
  const availableMinutes = availableHours * 60;

  // Planned minutes from active plan items
  const plannedMinutes = todayPlan.reduce((acc, item) => acc + (item.durationMinutes || 0), 0);

  const plannedHoursFormatted = `${Math.floor(plannedMinutes / 60)}h ${plannedMinutes % 60 ? (plannedMinutes % 60) + 'm' : ''}`.trim();
  const availableHoursFormatted = `${availableHours}h`;

  const remainingMinutes = Math.max(0, availableMinutes - plannedMinutes);
  const percentage = availableMinutes > 0 ? Math.min(100, Math.round((plannedMinutes / availableMinutes) * 100)) : 0;

  const remainingText =
    plannedMinutes === 0
      ? `No study sessions planned for today yet.`
      : remainingMinutes > 0
      ? `${remainingMinutes} minutes of study time remaining.`
      : `Study capacity reached for today. Excellent focus!`;

  return {
    plannedHoursFormatted: plannedMinutes === 0 ? '0h' : plannedHoursFormatted,
    availableHoursFormatted,
    percentage,
    remainingText,
    plannedMinutes,
    availableMinutes,
    remainingMinutes,
  };
}

/**
 * Format relative deadline string (e.g., "Tomorrow", "Due in 2 days", "Due in 4 days")
 */
export function formatDeadlineRelative(
  deadlineStr: string,
  currentDate: Date = new Date()
): { text: string; urgency: 'critical' | 'high' | 'medium' | 'normal' } {
  const deadline = new Date(deadlineStr);
  const now = currentDate.getTime();
  const diffHours = (deadline.getTime() - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return { text: 'Overdue', urgency: 'critical' };
  }
  if (diffHours <= 18) {
    return { text: 'Today', urgency: 'critical' };
  }
  if (diffHours <= 36) {
    return { text: 'Tomorrow', urgency: 'critical' };
  }
  const diffDays = Math.ceil(diffHours / 24);
  if (diffDays <= 2) {
    return { text: 'Due in 2 days', urgency: 'high' };
  }
  if (diffDays <= 4) {
    return { text: `Due in ${diffDays} days`, urgency: 'high' };
  }
  if (diffDays <= 7) {
    return { text: `Due in ${diffDays} days`, urgency: 'medium' };
  }
  return { text: `Due in ${diffDays} days`, urgency: 'normal' };
}

/**
 * Formats minutes into human friendly string (e.g., "45 min", "1h 30m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Calculates college lectures and commute time commitment for a specific day.
 */
export function calculateCollegeDayCommitment(
  day: string,
  lectures: CollegeLecture[] = [],
  commute: CollegeCommute = { commuteToCollegeMinutes: 30, commuteFromCollegeMinutes: 30 }
) {
  const dayLectures = lectures.filter((l) => l.day === day);
  let lectureMinutes = 0;
  let latestEndMinutes = 0;
  let latestEndTimeStr = '00:00';

  dayLectures.forEach((l) => {
    const [sh, sm] = l.startTime.split(':').map(Number);
    const [eh, em] = l.endTime.split(':').map(Number);
    const dur = (eh * 60 + em) - (sh * 60 + sm);
    if (dur > 0) lectureMinutes += dur;
    const endTotal = eh * 60 + em;
    if (endTotal > latestEndMinutes) {
      latestEndMinutes = endTotal;
      latestEndTimeStr = l.endTime;
    }
  });

  const hasCollege = dayLectures.length > 0;
  const toCommute = hasCollege ? (commute.commuteToCollegeMinutes || 0) : 0;
  const fromCommute = hasCollege ? (commute.commuteFromCollegeMinutes || 0) : 0;
  const commuteMinutes = toCommute + fromCommute;
  const totalCollegeMinutes = lectureMinutes + commuteMinutes;

  // Next available study start time slot (arrival home + 30 min buffer)
  let recommendedFirstStudySlot = '09:00';
  if (hasCollege) {
    const arriveHomeMinutes = latestEndMinutes + fromCommute + 30;
    const slotHour = Math.min(20, Math.max(14, Math.ceil(arriveHomeMinutes / 60)));
    recommendedFirstStudySlot = `${slotHour.toString().padStart(2, '0')}:00`;
  }

  return {
    day,
    lectureCount: dayLectures.length,
    lectureMinutes,
    commuteMinutes,
    totalCollegeMinutes,
    hasCollege,
    latestEndTimeStr,
    recommendedFirstStudySlot,
  };
}

const DAYS_OF_WEEK_LIST: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_INDEX_MAP: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

/**
 * Returns the day of the week from an ISO deadline string (e.g. "2026-09-11T23:59")
 */
export function getDayOfWeekFromDeadline(deadlineStr?: string): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | null {
  if (!deadlineStr) return null;
  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) return null;
  const dayIndex = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const lookup: Record<number, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };
  return lookup[dayIndex] || null;
}

export const getTaskDeadlineDay = getDayOfWeekFromDeadline;

/**
 * Finds next non-conflicting study time slot on a given day that does not clash with lectures or commute
 */
function findAvailableStudyTimeSlot(
  dayLectures: CollegeLecture[],
  commute: CollegeCommute,
  existingSessionsOnDay: PlannedSession[],
  sessionDurationMinutes: number = 60
): string {
  const commuteTo = commute.commuteToCollegeMinutes || 30;
  const commuteFrom = commute.commuteFromCollegeMinutes || 30;

  // Blocked intervals in minutes from midnight
  const blockedIntervals: { start: number; end: number }[] = [];

  // Add lectures and commute
  dayLectures.forEach((l) => {
    const [sh, sm] = l.startTime.split(':').map(Number);
    const [eh, em] = l.endTime.split(':').map(Number);
    const lectureStart = sh * 60 + sm;
    const lectureEnd = eh * 60 + em;
    // Buffer with commute
    blockedIntervals.push({
      start: Math.max(0, lectureStart - commuteTo),
      end: Math.min(24 * 60, lectureEnd + commuteFrom),
    });
  });

  // Add already scheduled sessions
  existingSessionsOnDay.forEach((s) => {
    const [sh, sm] = s.timeSlot.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = start + (s.durationMinutes || 60);
    blockedIntervals.push({ start, end });
  });

  // Candidate start times (in minutes) sorted by realistic student routine (afternoon/evening first, then morning)
  const candidateMinutes = [
    16 * 60,       // 16:00
    17 * 60 + 30,  // 17:30
    19 * 60,       // 19:00
    20 * 60 + 30,  // 20:30
    14 * 60 + 30,  // 14:30
    11 * 60,       // 11:00
    9 * 60 + 30,   // 09:30
    8 * 60 + 30,   // 08:30
    21 * 60 + 30,  // 21:30
  ];

  for (const cand of candidateMinutes) {
    const candEnd = cand + sessionDurationMinutes;
    const hasConflict = blockedIntervals.some(
      (b) => Math.max(cand, b.start) < Math.min(candEnd, b.end)
    );
    if (!hasConflict) {
      const h = Math.floor(cand / 60);
      const m = cand % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }

  // Fallback default
  const baseHour = 18 + existingSessionsOnDay.length;
  const clampedHour = Math.min(22, baseHour);
  return `${clampedHour.toString().padStart(2, '0')}:00`;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Determines the single best resting day of the week:
 * - Always reserves one full resting day with zero study sessions.
 * - Strict safety rule: Ensures there are NO assignments, quizzes, or exams on or near this day
 *   (i.e. neither on that day, nor on the very next day, nor exams in the next 2 days).
 * - Prefers weekend days or days with zero/low college lectures when safe.
 */
export function determineOptimalRestDay(
  tasks: Task[],
  lectures: CollegeLecture[] = []
): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' {
  const DAYS_ORDER: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  // Baseline preference: Saturdays & Sundays provide natural mental reset, followed by Friday
  const baseSuitability: Record<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday', number> = {
    Saturday: 160,
    Sunday: 140,
    Friday: 100,
    Wednesday: 70,
    Thursday: 50,
    Tuesday: 40,
    Monday: 40,
  };

  const scores: Record<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday', number> = {
    Monday: baseSuitability.Monday,
    Tuesday: baseSuitability.Tuesday,
    Wednesday: baseSuitability.Wednesday,
    Thursday: baseSuitability.Thursday,
    Friday: baseSuitability.Friday,
    Saturday: baseSuitability.Saturday,
    Sunday: baseSuitability.Sunday,
  };

  DAYS_ORDER.forEach((day, idx) => {
    const nextDay = DAYS_ORDER[(idx + 1) % 7];
    const dayAfterNext = DAYS_ORDER[(idx + 2) % 7];

    // Deduct heavily for college lecture hours on this day (a day full of lectures is not restful)
    const dayLectures = lectures.filter((l) => l.day === day);
    const lectureMins = dayLectures.reduce((sum, l) => {
      return sum + (parseTimeToMinutes(l.endTime) - parseTimeToMinutes(l.startTime));
    }, 0);
    scores[day] -= Math.round(lectureMins / 3);

    // Check deadlines for all active tasks
    activeTasks.forEach((task) => {
      const taskDeadlineDay = getTaskDeadlineDay(task.deadline);
      if (!taskDeadlineDay) return;

      const isExamOrQuiz = task.type === 'Exam' || task.type === 'Quiz';

      // 1. Task is due ON this day -> Cannot rest on deadline day!
      if (taskDeadlineDay === day) {
        scores[day] -= isExamOrQuiz ? 1500 : 700;
      }

      // 2. Task is due on NEXT day -> Cannot rest the day right before an assignment or exam!
      if (taskDeadlineDay === nextDay) {
        scores[day] -= isExamOrQuiz ? 1600 : 800;
      }

      // 3. Exam/Quiz is due on DAY AFTER NEXT -> Cannot rest 2 days before a major exam/quiz!
      if (isExamOrQuiz && taskDeadlineDay === dayAfterNext) {
        scores[day] -= 900;
      }
    });
  });

  // Pick the day with highest suitability score
  let bestDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' = 'Sunday';
  let highestScore = -Infinity;

  DAYS_ORDER.forEach((day) => {
    if (scores[day] > highestScore) {
      highestScore = scores[day];
      bestDay = day;
    }
  });

  return bestDay;
}

/**
 * Exam Auto-Decomposition:
 * When an exam or major project is added, automatically split it into multi-stage study milestones:
 * Stage 1: Concept Review -> Stage 2: Problem Solving & Application -> Stage 3: Past Exams & Final Practice
 * spread over the days leading up to the deadline.
 */
export function decomposeExamTasksInPool(tasks: Task[], courses: Course[] = []): Task[] {
  const resultTasks: Task[] = [];

  tasks.forEach((task) => {
    const isExamOrMajorProject =
      task.type === 'Exam' ||
      task.type === 'Quiz' ||
      task.type === 'Project' ||
      task.name.toLowerCase().includes('exam') ||
      task.name.toLowerCase().includes('midterm') ||
      task.name.toLowerCase().includes('final');

    const alreadyDecomposed =
      tasks.some((t) => t.id !== task.id && t.name.includes(task.name) && t.name.includes('Stage')) ||
      task.name.includes('Stage 1:') ||
      task.name.includes('Stage 2:') ||
      task.name.includes('Stage 3:');

    if (isExamOrMajorProject && !alreadyDecomposed && task.status !== 'completed') {
      const deadlineDate = new Date(task.deadline || new Date().toISOString());
      const course = courses.find((c) => c.id === task.courseId);

      // Stage 1: Concept Review (3 days before deadline)
      const date1 = new Date(deadlineDate.getTime() - 3 * 86400000);
      const stage1: Task = {
        ...task,
        id: `${task.id}-stage-1`,
        name: `${task.name} (Stage 1: Concept Review & Synthesis)`,
        estimatedMinutes: 60,
        type: 'Study',
        deadline: date1.toISOString().slice(0, 16),
        notes: `Stage 1 of Exam Prep: Synthesize core lecture notes and outline key formulas/theories for ${course?.name || 'course'}.`,
        smartPriorityScore: Math.min(99, (task.smartPriorityScore || 80) + 5),
        urgencyReason: `Phase 1 of 3-stage exam preparation milestone.`,
      };

      // Stage 2: Problem Solving & Active Recall (2 days before deadline)
      const date2 = new Date(deadlineDate.getTime() - 2 * 86400000);
      const stage2: Task = {
        ...task,
        id: `${task.id}-stage-2`,
        name: `${task.name} (Stage 2: Practice Problems & Application)`,
        estimatedMinutes: 60,
        type: 'Study',
        deadline: date2.toISOString().slice(0, 16),
        notes: `Stage 2 of Exam Prep: Solve practice questions, active recall flashcards, and homework set reviews.`,
        smartPriorityScore: Math.min(99, (task.smartPriorityScore || 80) + 8),
        urgencyReason: `Phase 2 of 3-stage exam preparation milestone.`,
      };

      // Stage 3: Past Exams & Final Practice (1 day before deadline)
      const date3 = new Date(deadlineDate.getTime() - 1 * 86400000);
      const stage3: Task = {
        ...task,
        id: `${task.id}-stage-3`,
        name: `${task.name} (Stage 3: Past Exams & Mock Review)`,
        estimatedMinutes: 60,
        type: task.type,
        deadline: date3.toISOString().slice(0, 16),
        notes: `Stage 3 of Exam Prep: Timed mock test, past exam paper review, and final high-yield topic check.`,
        smartPriorityScore: Math.min(99, (task.smartPriorityScore || 80) + 10),
        urgencyReason: `Final phase before exam/project deadline.`,
      };

      resultTasks.push(stage1, stage2, stage3);
    } else {
      resultTasks.push(task);
    }
  });

  return resultTasks;
}

/**
 * Rebalances weekly study plan taking into account:
 * 1. College lecture hours and commute to/from campus (strictly avoids clashes)
 * 2. User's configured daily study availability
 * 3. Deadlines: assignments/quizzes/exams are scheduled BEFORE deadlines!
 * 4. Course credit hours & task importance: subjects with more credits and higher importance receive proportionally more study time
 * 5. Mandatory designated resting day: reserves 1 full day of rest with no deadlines or exams near it
 */
export function rebalanceWeeklyPlanWithSchedule(
  tasks: Task[],
  availability: StudyAvailability,
  lectures: CollegeLecture[] = [],
  commute: CollegeCommute = { commuteToCollegeMinutes: 35, commuteFromCollegeMinutes: 35 },
  courses: Course[] = []
): PlannedSession[] {
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  if (activeTasks.length === 0) return [];

  // Determine optimal protected rest day that has zero deadlines or exams nearby
  const restDay = determineOptimalRestDay(tasks, lectures);

  // Sort tasks by credit weight + importance, priority score descending, and evaluations/quizzes first
  const sortedTasks = [...activeTasks].sort((a, b) => {
    const isEvalA = a.type === 'Exam' || a.type === 'Quiz' ? 1 : 0;
    const isEvalB = b.type === 'Exam' || b.type === 'Quiz' ? 1 : 0;
    if (isEvalB !== isEvalA) return isEvalB - isEvalA;

    const courseA = courses.find((c) => c.id === a.courseId);
    const courseB = courses.find((c) => c.id === b.courseId);
    const weightA = (courseA?.credits || 3) * (a.importance || 3);
    const weightB = (courseB?.credits || 3) * (b.importance || 3);

    if (b.smartPriorityScore !== a.smartPriorityScore) {
      return (b.smartPriorityScore + weightB * 0.5) - (a.smartPriorityScore + weightA * 0.5);
    }
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Map each day's study budget, college commitments, and net free capacity
  const dayCapacities = DAYS_OF_WEEK_LIST.map((day) => {
    const isRest = day === restDay;
    const college = calculateCollegeDayCommitment(day, lectures, commute);
    const configuredHours = isRest ? 0 : (availability.dailyHours[day] ?? 3);
    const configuredMinutes = configuredHours * 60;

    // Fixed college class hours in minutes
    const fixedCollegeMinutes = college.totalCollegeMinutes;
    const collegeClassHours = fixedCollegeMinutes / 60;

    // Net Free Capacity = Daily Configured Study Capacity - Fixed College Hours
    const netFreeMinutes = Math.max(0, configuredMinutes - fixedCollegeMinutes);

    // Realistic Workload Cap: If fixed college class hours exceed 4 hours (>240m),
    // cap scheduled study tasks for that day to AT MOST 1 or 2 light tasks (max 60-90m study)
    const isClassHeavy = fixedCollegeMinutes > 240;

    return {
      day,
      isRestDay: isRest,
      college,
      collegeClassHours,
      fixedCollegeMinutes,
      netFreeMinutes,
      isClassHeavy,
      dayLectures: lectures.filter((l) => l.day === day),
      budgetMinutes: configuredMinutes,
      allocatedMinutes: 0,
      sessionCount: 0,
      heavyAnalyticalCount: 0, // Prevent scheduling >2 heavy analytical subjects per day
      sessions: [] as PlannedSession[],
    };
  });

  // Distribute tasks respecting deadlines, credit weights, heavy analytical caps, and class workload offloading
  sortedTasks.forEach((task, taskIdx) => {
    const course = courses.find((c) => c.id === task.courseId);
    const credits = course?.credits || 3;
    const importance = task.importance || 3;
    const isHeavy = isHeavyAnalyticalTask(task, course) || task.difficulty >= 4 || credits >= 4;

    // Workload duration scales with credit hours, difficulty, and importance
    let taskDuration = task.estimatedMinutes || 45;
    if (credits >= 4 || importance >= 4 || task.difficulty >= 4) {
      taskDuration = Math.min(90, Math.max(60, taskDuration));
    } else if (credits <= 2 && importance <= 2 && task.difficulty <= 2) {
      taskDuration = Math.min(45, Math.max(25, taskDuration));
    }

    const deadlineDay = getTaskDeadlineDay(task.deadline);
    const deadlineDayIdx = deadlineDay ? DAY_INDEX_MAP[deadlineDay] ?? 6 : 6;

    // Filter candidate days: must be on or before deadline day AND not the resting day!
    const nonRestDays = dayCapacities.filter((d) => !d.isRestDay);
    const eligibleDays = nonRestDays.filter((d) => {
      const idx = DAY_INDEX_MAP[d.day];
      return idx <= deadlineDayIdx;
    });

    const pool = eligibleDays.length > 0 ? eligibleDays : nonRestDays;
    if (pool.length === 0) return;

    // Filter out class-heavy days (>4h classes) if the day already has 1 or 2 sessions or if task is heavy
    let candidateDays = pool.filter((d) => {
      if (d.isClassHeavy) {
        // Cap class-heavy days (>4h classes) to AT MOST 1 or 2 light tasks (or max 75m allocated)
        if (d.sessionCount >= 2 || d.allocatedMinutes >= 75) return false;
        if (isHeavy) return false; // Offload heavy tasks away from class-heavy days
      }
      return true;
    });

    if (candidateDays.length === 0) {
      candidateDays = pool; // Fallback if all available days are class-heavy
    }

    // WORKLOAD BALANCING RULE: Prevent scheduling more than 2 heavy analytical subjects on the same day
    if (isHeavy) {
      const nonOverloadedDays = candidateDays.filter((d) => d.heavyAnalyticalCount < 2);
      if (nonOverloadedDays.length > 0) {
        candidateDays = nonOverloadedDays;
      }

      // SMART LOAD OFFLOADING: Prefer low-class days (0-2 class hours) or weekend days for heavy tasks!
      const lowClassDays = candidateDays.filter(
        (d) => d.fixedCollegeMinutes <= 120 || d.day === 'Saturday' || d.day === 'Sunday'
      );
      if (lowClassDays.length > 0) {
        candidateDays = lowClassDays;
      }
    }

    let bestDayObj = candidateDays[0];

    if (task.type === 'Exam' || task.type === 'Quiz') {
      // Prioritize days immediately leading up to the quiz/exam (day before or deadline day)
      const targetDays = candidateDays.filter((d) => {
        const idx = DAY_INDEX_MAP[d.day];
        return idx === deadlineDayIdx || idx === Math.max(0, deadlineDayIdx - 1);
      });
      const candidates = targetDays.length > 0 ? targetDays : candidateDays;
      bestDayObj = candidates.reduce((best, curr) =>
        curr.allocatedMinutes < best.allocatedMinutes ? curr : best
      );
    } else {
      // For assignments & general tasks: pick day with lowest load ratio before deadline
      let minLoadRatio = 9999;
      candidateDays.forEach((dayObj) => {
        const totalCommitted = dayObj.allocatedMinutes + (dayObj.fixedCollegeMinutes * 0.4);
        const ratio = totalCommitted / Math.max(60, dayObj.budgetMinutes);
        if (ratio < minLoadRatio) {
          minLoadRatio = ratio;
          bestDayObj = dayObj;
        }
      });
    }

    // Track heavy analytical subject count & session count for this day
    if (isHeavy) {
      bestDayObj.heavyAnalyticalCount += 1;
    }
    bestDayObj.sessionCount += 1;

    // Find non-conflicting time slot on the selected day
    const timeSlot = findAvailableStudyTimeSlot(
      bestDayObj.dayLectures,
      commute,
      bestDayObj.sessions,
      taskDuration
    );

    const newSession: PlannedSession = {
      id: `smart-session-${task.id}-${taskIdx}-${Date.now()}`,
      taskId: task.id,
      day: bestDayObj.day,
      timeSlot,
      durationMinutes: taskDuration,
      completed: false,
    };

    bestDayObj.sessions.push(newSession);
    bestDayObj.allocatedMinutes += taskDuration;
  });

  return dayCapacities.flatMap((d) => d.sessions);
}

export interface SmartStudyPlanGenerationResult {
  newCourses: Course[];
  allCourses: Course[];
  newTasks: Task[];
  allTasks: Task[];
  weeklyPlan: PlannedSession[];
  todayPlan: TodayPlanItem[];
  availability: StudyAvailability;
  restDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
}

/**
 * Organizes the student's courses and tasks into an optimized study plan
 * based on their entered lectures, lab classes, and commute availability.
 * Automatically scales workload according to credit hours and subject importance,
 * guarantees a protected resting day with no nearby exams/deadlines,
 * and dynamically remakes the plan to meet all deadlines when tasks/quizzes/assignments are added.
 */
export function generateSmartStudyPlanFromLecturesAndCourses({
  existingCourses,
  existingTasks,
  lectures,
  commute,
  suggestedDailyHours,
  materials = [],
}: {
  existingCourses: Course[];
  existingTasks: Task[];
  lectures: CollegeLecture[];
  commute?: CollegeCommute;
  suggestedDailyHours: StudyAvailability['dailyHours'];
  autoGenerateTasks?: boolean;
  materials?: CourseMaterial[];
}): SmartStudyPlanGenerationResult {
  const activeCommute: CollegeCommute = commute || { commuteToCollegeMinutes: 15, commuteFromCollegeMinutes: 15 };
  const allCourses = [...existingCourses];
  const newCourses: Course[] = [];
  let allTasks = [...existingTasks];
  const newTasks: Task[] = [];

  // Helper to ground a task in course materials
  const groundTaskInMaterial = (task: Task, course: Course): Task => {
    const courseMats = materials.filter(
      (m) => m.courseId === course.id || (m.courseName && m.courseName.toLowerCase() === course.name.toLowerCase())
    );
    if (courseMats.length === 0) {
      return {
        ...task,
        exactReading: task.exactReading || `Section 2.1–2.4 in ${course.name} Core Textbook`,
        targetOutcome: task.targetOutcome || `By the end of this session, master key theoretical principles of ${course.name}.`,
        exerciseTarget: task.exerciseTarget || `Complete Problem Set Exercises 1–10.`,
        keyConceptsList: task.keyConceptsList || [`${course.name} Foundations`, 'Analytical Methods'],
      };
    }
    const mat = courseMats[0];
    const outlineItem = mat.chapterOutline[0];
    return {
      ...task,
      materialId: mat.id,
      materialTitle: mat.title,
      exactReading:
        task.exactReading ||
        (outlineItem?.pageRange ? `${outlineItem.pageRange} in ${mat.title}` : `Pages 1–30 in ${mat.title}`),
      targetOutcome:
        task.targetOutcome ||
        (outlineItem?.summary
          ? `By the end of this session: ${outlineItem.summary}`
          : `Master foundational principles from ${mat.title}.`),
      exerciseTarget:
        task.exerciseTarget ||
        (mat.practiceProblems && mat.practiceProblems.length > 0
          ? mat.practiceProblems[0]
          : `Complete Exercises in ${mat.title}`),
      keyConceptsList:
        task.keyConceptsList ||
        (mat.keyFormulasAndConcepts && mat.keyFormulasAndConcepts.length > 0
          ? mat.keyFormulasAndConcepts.map((k) => k.concept)
          : mat.topicsSummary || []),
    };
  };

  // Ground all existing tasks in course materials if applicable
  allTasks = allTasks.map((t) => {
    const matchedCourse = allCourses.find((c) => c.id === t.courseId);
    if (matchedCourse) {
      return groundTaskInMaterial(t, matchedCourse);
    }
    return t;
  });

  // If the student has courses, ensure there are study tasks scaled by credit hours & importance!
  if (existingCourses.length > 0) {
    existingCourses.forEach((course, cIdx) => {
      // Check if course already has active tasks
      const courseTasks = allTasks.filter((t) => t.courseId === course.id && t.status !== 'completed');
      if (courseTasks.length === 0) {
        const creditHours = course.credits || 3;
        const baseDate = new Date();

        if (creditHours >= 4) {
          // 4+ Credit Courses: Core subject receiving 3 intensive study blocks (~3.5h - 4.5h)
          const task1: Task = {
            id: `task-study-${course.id}-1-${Date.now() + cIdx * 10}`,
            courseId: course.id,
            name: `${course.name}: Core Concepts & Lecture Synthesis`,
            type: 'Study',
            deadline: new Date(baseDate.getTime() + 2 * 86400000).toISOString().slice(0, 16),
            estimatedMinutes: 75,
            importance: 5,
            difficulty: 4,
            status: 'todo',
            smartPriorityScore: 88,
            urgencyReason: `High credit core subject (${creditHours} credits) requiring early in-depth lecture synthesis.`,
          };
          const task2: Task = {
            id: `task-study-${course.id}-2-${Date.now() + cIdx * 10 + 1}`,
            courseId: course.id,
            name: `${course.name}: Deep Problem Practice & Application`,
            type: 'Study',
            deadline: new Date(baseDate.getTime() + 4 * 86400000).toISOString().slice(0, 16),
            estimatedMinutes: 90,
            importance: 5,
            difficulty: 5,
            status: 'todo',
            smartPriorityScore: 84,
            urgencyReason: `Major problem-solving block for ${creditHours}-credit course to master analytical applications.`,
          };
          const task3: Task = {
            id: `task-study-${course.id}-3-${Date.now() + cIdx * 10 + 2}`,
            courseId: course.id,
            name: `${course.name}: Active Recall & Mastery Testing`,
            type: 'Study',
            deadline: new Date(baseDate.getTime() + 6 * 86400000).toISOString().slice(0, 16),
            estimatedMinutes: 60,
            importance: 4,
            difficulty: 4,
            status: 'todo',
            smartPriorityScore: 79,
            urgencyReason: `Self-testing and concept retention review for ${course.name}.`,
          };
          newTasks.push(task1, task2, task3);
          allTasks.push(task1, task2, task3);
        } else if (creditHours === 3) {
          // Standard 3-Credit Courses: 2 balanced study blocks (~2h)
          const task1: Task = {
            id: `task-study-${course.id}-1-${Date.now() + cIdx * 10}`,
            courseId: course.id,
            name: `${course.name}: Lecture Review & Notes`,
            type: 'Study',
            deadline: new Date(baseDate.getTime() + 3 * 86400000).toISOString().slice(0, 16),
            estimatedMinutes: 60,
            importance: 4,
            difficulty: 3,
            status: 'todo',
            smartPriorityScore: 78,
            urgencyReason: `Weekly review session for ${course.name} to reinforce core concepts.`,
          };
          const task2: Task = {
            id: `task-study-${course.id}-2-${Date.now() + cIdx * 10 + 1}`,
            courseId: course.id,
            name: `${course.name}: Problem Practice & Synthesis`,
            type: 'Study',
            deadline: new Date(baseDate.getTime() + 5 * 86400000).toISOString().slice(0, 16),
            estimatedMinutes: 60,
            importance: 4,
            difficulty: 4,
            status: 'todo',
            smartPriorityScore: 74,
            urgencyReason: `Dedicated practice and problem-solving block for ${course.name}.`,
          };
          newTasks.push(task1, task2);
          allTasks.push(task1, task2);
        } else {
          // 1-2 Credit Courses / Labs: 1 focused preparation block (~40m)
          const task1: Task = {
            id: `task-study-${course.id}-1-${Date.now() + cIdx * 10}`,
            courseId: course.id,
            name: `${course.name}: Practical Prep & Review`,
            type: 'Study',
            deadline: new Date(baseDate.getTime() + 3 * 86400000).toISOString().slice(0, 16),
            estimatedMinutes: 40,
            importance: 3,
            difficulty: 2,
            status: 'todo',
            smartPriorityScore: 68,
            urgencyReason: `Targeted review session for ${creditHours}-credit course.`,
          };
          newTasks.push(task1);
          allTasks.push(task1);
        }
      }
    });
  }

  // Decompose major exams/projects into multi-stage study milestones
  allTasks = decomposeExamTasksInPool(allTasks, allCourses);

  // Recalculate smart priorities for all tasks with course credit awareness
  allTasks = allTasks.map((t) => {
    const course = allCourses.find((c) => c.id === t.courseId);
    const { score, reason } = calculateSmartPriority(t, new Date(), course);
    return {
      ...t,
      smartPriorityScore: score,
      urgencyReason: reason,
    };
  });

  const updatedAvailability: StudyAvailability = {
    dailyHours: suggestedDailyHours,
    preferredTime: 'Evening',
  };

  // Rebalance weekly plan using schedule constraints, credit weights, and guaranteed rest day
  const weeklyPlan = allTasks.length > 0
    ? rebalanceWeeklyPlanWithSchedule(allTasks, updatedAvailability, lectures, activeCommute, allCourses)
    : [];

  const restDay = determineOptimalRestDay(allTasks, lectures);

  // Determine current day of week (e.g. Wednesday)
  const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayNameLookup: Record<number, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };
  const todayName = dayNameLookup[currentDayIndex] || 'Wednesday';

  // Derive today's plan from sessions matching today
  const todaySessions = weeklyPlan.filter((s) => s.day === todayName);
  let todayPlan: TodayPlanItem[] = todaySessions.map((s, idx) => ({
    id: `today-plan-${s.id || idx}`,
    taskId: s.taskId,
    timeSlot: s.timeSlot,
    durationMinutes: s.durationMinutes,
    completed: false,
  }));

  // If today is NOT the designated rest day and has no sessions scheduled, schedule top urgent task
  if (todayName !== restDay && todayPlan.length === 0 && allTasks.length > 0) {
    const topTask = getDoThisNowTask(allTasks);
    if (topTask) {
      todayPlan = [
        {
          id: `today-plan-top-${Date.now()}`,
          taskId: topTask.id,
          timeSlot: '18:00',
          durationMinutes: topTask.estimatedMinutes || 45,
          completed: false,
        },
      ];
    }
  }

  return {
    newCourses,
    allCourses,
    newTasks,
    allTasks,
    weeklyPlan,
    todayPlan,
    availability: updatedAvailability,
    restDay,
  };
}


