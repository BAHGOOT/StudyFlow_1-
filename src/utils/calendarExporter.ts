import { PlannedSession, Task, Course, CollegeLecture } from '../types';

/**
 * Generates an RFC 5545 compliant .ics calendar file string
 */
export function generateIcsFileContent(
  weeklyPlan: PlannedSession[],
  tasks: Task[],
  courses: Course[],
  lectures: CollegeLecture[] = []
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyFlow//Academic Planner & Study Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:StudyFlow Academic Schedule',
    'X-WR-TIMEZONE:UTC',
  ];

  const now = new Date();
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Helper to map Day of Week name to the next date object
  const getNextDateForDay = (dayName: string): Date => {
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const targetDay = dayMap[dayName] ?? 1;
    const d = new Date();
    const currentDay = d.getDay();
    let distance = targetDay - currentDay;
    if (distance < 0) distance += 7;
    d.setDate(d.getDate() + distance);
    return d;
  };

  // 1. Export Study Sessions from Weekly Plan
  weeklyPlan.forEach((session, index) => {
    const task = tasks.find((t) => t.id === session.taskId);
    const course = courses.find((c) => c.id === task?.courseId);

    const sessionDate = getNextDateForDay(session.day);
    const [startH, startM] = (session.timeSlot || '14:00').split(':').map(Number);
    sessionDate.setHours(startH || 14, startM || 0, 0, 0);

    const endDate = new Date(sessionDate.getTime() + (session.durationMinutes || 60) * 60000);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:studyflow-session-${session.id || index}-${sessionDate.getTime()}@studyflow.app`);
    lines.push(`DTSTAMP:${formatIcsDate(now)}`);
    lines.push(`DTSTART:${formatIcsDate(sessionDate)}`);
    lines.push(`DTEND:${formatIcsDate(endDate)}`);
    lines.push(`SUMMARY:📚 Study: ${task?.name || 'Study Block'} (${course?.code || 'Course'})`);
    lines.push(`DESCRIPTION:Study session for ${course?.name || 'Course'}. Reading: ${task?.exactReading || 'Review assigned materials'}. Target: ${task?.targetOutcome || 'Master core concepts'}.`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  // 2. Export Upcoming Exams & Quizzes
  tasks
    .filter((t) => t.type === 'Exam' || t.type === 'Quiz' || t.type === 'Project')
    .forEach((exam) => {
      const course = courses.find((c) => c.id === exam.courseId);
      const examDate = exam.deadline ? new Date(exam.deadline) : new Date(now.getTime() + 86400000 * 3);
      const endDate = new Date(examDate.getTime() + 120 * 60000); // 2 hrs

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:studyflow-exam-${exam.id}@studyflow.app`);
      lines.push(`DTSTAMP:${formatIcsDate(now)}`);
      lines.push(`DTSTART:${formatIcsDate(examDate)}`);
      lines.push(`DTEND:${formatIcsDate(endDate)}`);
      lines.push(`SUMMARY:🎯 ${exam.type || 'Exam'}: ${exam.name} (${course?.code || 'Course'})`);
      lines.push(`DESCRIPTION:${exam.type || 'Exam'} Milestone for ${course?.name || 'Course'}. Target Outcome: ${exam.targetOutcome || 'Pass with 80%+ score'}.`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

  // 3. Export Fixed College Lectures
  lectures.forEach((lecture) => {
    const lectureDate = getNextDateForDay(lecture.day);
    const [startH, startM] = (lecture.startTime || '09:00').split(':').map(Number);
    const [endH, endM] = (lecture.endTime || '10:00').split(':').map(Number);

    const start = new Date(lectureDate);
    start.setHours(startH || 9, startM || 0, 0, 0);

    const end = new Date(lectureDate);
    end.setHours(endH || 10, endM || 0, 0, 0);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:studyflow-lecture-${lecture.id}@studyflow.app`);
    lines.push(`DTSTAMP:${formatIcsDate(now)}`);
    lines.push(`DTSTART:${formatIcsDate(start)}`);
    lines.push(`DTEND:${formatIcsDate(end)}`);
    lines.push(`SUMMARY:🏛️ Lecture: ${lecture.courseName} (${lecture.courseCode || 'Class'})`);
    lines.push(`DESCRIPTION:College lecture for ${lecture.courseName}. Location: ${lecture.location || 'TBA'}.`);
    lines.push(`LOCATION:${lecture.location || 'Campus'}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers browser file download for the generated .ics calendar file
 */
export function downloadCalendarIcsFile(
  weeklyPlan: PlannedSession[],
  tasks: Task[],
  courses: Course[],
  lectures: CollegeLecture[] = []
): void {
  const content = generateIcsFileContent(weeklyPlan, tasks, courses, lectures);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'studyflow_academic_schedule.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
