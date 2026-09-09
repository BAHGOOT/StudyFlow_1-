import {
  CollegeLecture,
  Course,
  Task,
  TodayPlanItem,
  PlannedSession,
  StudyAvailability,
  CollegeCommute,
} from '../types';
import { calculateSmartPriority, rebalanceWeeklyPlanWithSchedule } from '../utils/smartPlanner';

export interface ScannedTimetableResult {
  lectures: CollegeLecture[];
  courses: Course[];
  tasks: Task[];
  suggestedDailyHours: StudyAvailability['dailyHours'];
  todayPlan: TodayPlanItem[];
  weeklyPlan: PlannedSession[];
  summary: string;
}

const COLOR_PALETTES = [
  { color: 'indigo', accentHex: '#6366f1' },
  { color: 'blue', accentHex: '#3b82f6' },
  { color: 'emerald', accentHex: '#10b981' },
  { color: 'amber', accentHex: '#f59e0b' },
  { color: 'rose', accentHex: '#f43f5e' },
  { color: 'violet', accentHex: '#8b5cf6' },
  { color: 'teal', accentHex: '#14b8a6' },
  { color: 'cyan', accentHex: '#06b6d4' },
];

const VALID_DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Normalizes day string to canonical Day format
 */
function normalizeDay(dayStr: string): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' {
  const lower = (dayStr || '').trim().toLowerCase();
  if (lower.startsWith('mon')) return 'Monday';
  if (lower.startsWith('tue')) return 'Tuesday';
  if (lower.startsWith('wed')) return 'Wednesday';
  if (lower.startsWith('thu')) return 'Thursday';
  if (lower.startsWith('fri')) return 'Friday';
  if (lower.startsWith('sat')) return 'Saturday';
  if (lower.startsWith('sun')) return 'Sunday';
  return 'Monday';
}

/**
 * Normalizes time string to HH:MM format
 */
function normalizeTime(timeStr: string, fallback: string): string {
  if (!timeStr) return fallback;
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const hh = match[1].padStart(2, '0');
    const mm = match[2];
    return `${hh}:${mm}`;
  }
  return fallback;
}

/**
 * Scan timetable image with server-side Gemini Vision AI and synthesize courses, tasks, and balanced study schedule.
 */
export async function scanTimetableWithAI(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  existingCourses: Course[] = [],
  currentAvailability: StudyAvailability,
  commute: CollegeCommute = { commuteToCollegeMinutes: 30, commuteFromCollegeMinutes: 30 },
  currentTasks: Task[] = []
): Promise<ScannedTimetableResult> {
  let apiResponseData: any = null;

  try {
    const response = await fetch('/api/scan-timetable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        existingCourses: existingCourses.map((c) => ({ id: c.id, name: c.name, code: c.code })),
      }),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        apiResponseData = json.data;
      }
    }
  } catch (err) {
    console.warn('Network call to /api/scan-timetable failed, utilizing client synthesis fallback:', err);
  }

  // If server responded with extracted data
  if (apiResponseData && (Array.isArray(apiResponseData.lectures) || Array.isArray(apiResponseData.courses))) {
    return processExtractedData(apiResponseData, existingCourses, currentAvailability, commute, currentTasks);
  }

  throw new Error('Unable to scan timetable. Please ensure your timetable image is clearly legible or enter your classes manually.');
}

/**
 * Formats and correlates extracted data into complete applet entities
 */
function processExtractedData(
  data: any,
  existingCourses: Course[],
  currentAvailability: StudyAvailability,
  commute: CollegeCommute,
  currentTasks: Task[]
): ScannedTimetableResult {
  const extractedLecturesRaw: any[] = Array.isArray(data.lectures) ? data.lectures : [];
  const extractedCoursesRaw: any[] = Array.isArray(data.courses) ? data.courses : [];
  const extractedTasksRaw: any[] = Array.isArray(data.tasks) ? data.tasks : [];

  // 1. Map & Create Courses
  const newCourses: Course[] = [];
  const courseNameToIdMap: Record<string, string> = {};

  // Register existing courses
  existingCourses.forEach((c) => {
    courseNameToIdMap[c.name.toLowerCase().trim()] = c.id;
    if (c.code) courseNameToIdMap[c.code.toLowerCase().trim()] = c.id;
  });

  // Process extracted courses
  extractedCoursesRaw.forEach((cRaw, idx) => {
    const name = (cRaw.name || `Course ${idx + 1}`).trim();
    const code = (cRaw.code || `CRS ${100 + idx}`).trim();
    const existingId = courseNameToIdMap[name.toLowerCase()] || (code ? courseNameToIdMap[code.toLowerCase()] : null);

    if (existingId) {
      courseNameToIdMap[name.toLowerCase()] = existingId;
    } else {
      const palette = COLOR_PALETTES[(existingCourses.length + newCourses.length) % COLOR_PALETTES.length];
      const courseId = `crs-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      const newCourse: Course = {
        id: courseId,
        name,
        code,
        color: cRaw.color || palette.color,
        accentHex: cRaw.accentHex || palette.accentHex,
        credits: cRaw.credits || 3,
        professor: cRaw.professor || undefined,
      };
      newCourses.push(newCourse);
      courseNameToIdMap[name.toLowerCase()] = courseId;
      if (code) courseNameToIdMap[code.toLowerCase()] = courseId;
    }
  });

  // Also check lectures for any course names not yet registered
  extractedLecturesRaw.forEach((lRaw) => {
    const name = (lRaw.courseName || '').trim();
    if (name && !courseNameToIdMap[name.toLowerCase()]) {
      const palette = COLOR_PALETTES[(existingCourses.length + newCourses.length) % COLOR_PALETTES.length];
      const courseId = `crs-${Date.now()}-${newCourses.length}-${Math.random().toString(36).substring(2, 6)}`;
      const newCourse: Course = {
        id: courseId,
        name,
        code: lRaw.courseCode || name.substring(0, 4).toUpperCase(),
        color: palette.color,
        accentHex: palette.accentHex,
        credits: 3,
      };
      newCourses.push(newCourse);
      courseNameToIdMap[name.toLowerCase()] = courseId;
    }
  });

  const allAvailableCourses = [...existingCourses, ...newCourses];

  // 2. Format Lectures
  const lectures: CollegeLecture[] = extractedLecturesRaw.map((lRaw, idx) => {
    const day = normalizeDay(lRaw.day);
    const startTime = normalizeTime(lRaw.startTime, '09:00');
    const endTime = normalizeTime(lRaw.endTime, '11:00');
    const courseName = (lRaw.courseName || 'Class Lecture').trim();
    const location = (lRaw.location || 'Lecture Hall').trim();

    return {
      id: `lec-scan-${Date.now()}-${idx}`,
      courseName,
      courseCode: lRaw.courseCode || undefined,
      day,
      startTime,
      endTime,
      location,
    };
  });

  // 3. Format Study & Syllabus Tasks
  const now = new Date('2026-09-08T11:42:00');
  const tasks: Task[] = [];

  extractedTasksRaw.forEach((tRaw, idx) => {
    const courseName = (tRaw.courseName || '').trim().toLowerCase();
    let courseId = courseNameToIdMap[courseName];

    if (!courseId && allAvailableCourses.length > 0) {
      courseId = allAvailableCourses[idx % allAvailableCourses.length].id;
    }

    if (!courseId) return;

    const daysAhead = typeof tRaw.daysFromNow === 'number' ? Math.max(1, tRaw.daysFromNow) : (idx % 7) + 2;
    const deadlineDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const deadlineStr = deadlineDate.toISOString().split('T')[0] + 'T23:59';

    const importance = Math.min(5, Math.max(1, tRaw.importance || 3));
    const difficulty = Math.min(5, Math.max(1, tRaw.difficulty || 3));
    const estimatedMinutes = Math.min(180, Math.max(20, tRaw.estimatedMinutes || 60));
    const type = (['Assignment', 'Quiz', 'Exam', 'Project', 'Study'].includes(tRaw.type)
      ? tRaw.type
      : 'Assignment') as Task['type'];

    const partialTask: Partial<Task> = {
      importance,
      difficulty,
      deadline: deadlineStr,
      estimatedMinutes,
      type,
    };

    const { score, reason } = calculateSmartPriority(partialTask, now);

    tasks.push({
      id: `task-scan-${Date.now()}-${idx}`,
      name: (tRaw.name || `Review for ${tRaw.courseName || 'Course'}`).trim(),
      courseId,
      type,
      deadline: deadlineStr,
      estimatedMinutes,
      importance,
      difficulty,
      status: 'todo',
      smartPriorityScore: score,
      urgencyReason: reason,
      notes: `Generated automatically by Timetable Schedule Vision Scanner.`,
    });
  });

  // If no tasks were extracted by model, generate standard tasks for each new course
  if (tasks.length === 0 && allAvailableCourses.length > 0) {
    allAvailableCourses.forEach((crs, cIdx) => {
      const sampleDefs = [
        { name: `Problem Set 1: ${crs.name} Foundations`, type: 'Assignment' as const, days: 3, mins: 60, imp: 4, diff: 3 },
        { name: `Review Lecture Notes & Slides: ${crs.name}`, type: 'Study' as const, days: 5, mins: 45, imp: 3, diff: 2 },
        { name: `Weekly Preparation Quiz for ${crs.name}`, type: 'Quiz' as const, days: 7, mins: 45, imp: 4, diff: 4 },
      ];

      sampleDefs.forEach((def, sIdx) => {
        const deadlineDate = new Date(now.getTime() + def.days * 24 * 60 * 60 * 1000);
        const deadlineStr = deadlineDate.toISOString().split('T')[0] + 'T23:59';
        const { score, reason } = calculateSmartPriority(
          { importance: def.imp, difficulty: def.diff, deadline: deadlineStr, estimatedMinutes: def.mins, type: def.type },
          now
        );

        tasks.push({
          id: `task-scan-gen-${Date.now()}-${cIdx}-${sIdx}`,
          name: def.name,
          courseId: crs.id,
          type: def.type,
          deadline: deadlineStr,
          estimatedMinutes: def.mins,
          importance: def.imp,
          difficulty: def.diff,
          status: 'todo',
          smartPriorityScore: score,
          urgencyReason: reason,
          notes: 'Auto-generated study plan task from course timetable.',
        });
      });
    });
  }

  // 4. Calculate Suggested Study Availability per day
  const suggestedDailyHours: StudyAvailability['dailyHours'] = { ...currentAvailability.dailyHours };

  VALID_DAYS.forEach((day) => {
    const dayLectures = lectures.filter((l) => l.day === day);
    let lectureMins = 0;
    dayLectures.forEach((l) => {
      const [sh, sm] = l.startTime.split(':').map(Number);
      const [eh, em] = l.endTime.split(':').map(Number);
      const dur = (eh * 60 + em) - (sh * 60 + sm);
      if (dur > 0) lectureMins += dur;
    });

    const hasCollege = dayLectures.length > 0;
    const commuteMins = hasCollege ? (commute.commuteToCollegeMinutes + commute.commuteFromCollegeMinutes) : 0;
    const totalCollegeHours = (lectureMins + commuteMins) / 60;
    const sleepAndBasics = 10;
    const remainingFreeTime = Math.max(0, 24 - (sleepAndBasics + totalCollegeHours));

    let recStudy = Math.round((remainingFreeTime * 0.45) * 2) / 2;
    recStudy = Math.max(1.5, Math.min(6, recStudy));
    suggestedDailyHours[day] = recStudy;
  });

  const updatedAvailability: StudyAvailability = {
    ...currentAvailability,
    dailyHours: suggestedDailyHours,
  };

  // 5. Generate Weekly Plan & Today Plan
  const allCombinedTasks = [...currentTasks, ...tasks];
  const weeklyPlan = rebalanceWeeklyPlanWithSchedule(allCombinedTasks, updatedAvailability, lectures, commute);

  // Generate Today's plan from the top priority tasks
  const sortedTasks = [...allCombinedTasks].sort((a, b) => b.smartPriorityScore - a.smartPriorityScore);
  const todayTopTasks = sortedTasks.slice(0, 3);
  const todayPlan: TodayPlanItem[] = todayTopTasks.map((t, idx) => ({
    id: `today-scan-${t.id}-${idx}`,
    taskId: t.id,
    timeSlot: `${(15 + idx * 2).toString().padStart(2, '0')}:00`,
    durationMinutes: Math.min(60, t.estimatedMinutes),
    completed: false,
  }));

  const summary = data.summary || `Extracted ${lectures.length} lecture blocks across ${allAvailableCourses.length} courses, created ${tasks.length} study tasks, and optimized weekly study schedule.`;

  return {
    lectures,
    courses: newCourses,
    tasks,
    suggestedDailyHours,
    todayPlan,
    weeklyPlan,
    summary,
  };
}
