import { useState, useEffect, useRef } from 'react';
import { Task, Course, TreeSpecies, PlantedTree, PomodoroMode } from '../types';
import { DEFAULT_SPECIES_BY_COURSE } from '../data/treeSpecies';

export const FOCUS_DURATION_MINUTES = 30; // 30 minutes focus
export const SHORT_BREAK_MINUTES = 5;      // 5 minutes break
export const LONG_BREAK_MINUTES = 30;     // 30 minutes break after 3 hours (180 min)

export function useFocusSession(
  onPlantTree: (tree: Omit<PlantedTree, 'id' | 'plantedAt' | 'weekNumber' | 'dayOfWeek' | 'month' | 'status'>) => void,
  onCompleteTask: (taskId: string) => void,
  unlockedSpecies: TreeSpecies[] = ['Oak', 'Pine', 'Birch'],
  onAbandonTask?: (taskId: string) => void
) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [pomodoroCount, setPomodoroCount] = useState<number>(1);
  const [accumulatedFocusMinutes, setAccumulatedFocusMinutes] = useState<number>(0);

  const [selectedSpecies, setSelectedSpecies] = useState<TreeSpecies>('Oak');
  const [initialSeconds, setInitialSeconds] = useState<number>(FOCUS_DURATION_MINUTES * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(FOCUS_DURATION_MINUTES * 60);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [hasPlantedThisSession, setHasPlantedThisSession] = useState<boolean>(false);

  // Keep references to prevent closure staleness in timer
  const stateRef = useRef({
    activeTask,
    activeCourse,
    mode,
    selectedSpecies,
    accumulatedFocusMinutes,
    hasPlantedThisSession,
    pomodoroCount,
  });

  useEffect(() => {
    stateRef.current = {
      activeTask,
      activeCourse,
      mode,
      selectedSpecies,
      accumulatedFocusMinutes,
      hasPlantedThisSession,
      pomodoroCount,
    };
  }, [
    activeTask,
    activeCourse,
    mode,
    selectedSpecies,
    accumulatedFocusMinutes,
    hasPlantedThisSession,
    pomodoroCount,
  ]);

  const startSession = (task: Task, course?: Course) => {
    // If this exact task is already the active focus session, just unminimize/expand without resetting timer progress
    if (activeTask && activeTask.id === task.id) {
      setIsMinimized(false);
      setIsActive(true);
      return;
    }

    setActiveTask(task);
    setActiveCourse(course || null);
    setIsMinimized(false);
    setMode('focus');
    setPomodoroCount(1);
    setAccumulatedFocusMinutes(0);
    setHasPlantedThisSession(false);

    const preferred = course ? DEFAULT_SPECIES_BY_COURSE[course.name] : 'Oak';
    if (preferred && unlockedSpecies.includes(preferred)) {
      setSelectedSpecies(preferred);
    } else {
      setSelectedSpecies(unlockedSpecies[0] || 'Oak');
    }

    const secs = FOCUS_DURATION_MINUTES * 60;
    setInitialSeconds(secs);
    setSecondsRemaining(secs);
    setIsActive(true);
  };

  const pauseSession = () => setIsActive(false);
  const resumeSession = () => setIsActive(true);
  const toggleActive = () => setIsActive((prev) => !prev);

  const minimizeSession = () => setIsMinimized(true);
  const expandSession = () => setIsMinimized(false);

  const abandonSession = () => {
    if (activeTask && onAbandonTask) {
      onAbandonTask(activeTask.id);
    }
    setIsActive(false);
    setActiveTask(null);
    setActiveCourse(null);
    setIsMinimized(false);
    setSecondsRemaining(FOCUS_DURATION_MINUTES * 60);
  };

  const finishAndComplete = () => {
    if (activeTask) {
      onCompleteTask(activeTask.id);
    }
    abandonSession();
  };

  const addFiveMinutes = () => {
    setSecondsRemaining((sec) => sec + 5 * 60);
    setInitialSeconds((sec) => sec + 5 * 60);
  };

  const resetTimer = () => {
    const nextSecs =
      mode === 'short_break'
        ? SHORT_BREAK_MINUTES * 60
        : mode === 'long_break'
        ? LONG_BREAK_MINUTES * 60
        : FOCUS_DURATION_MINUTES * 60;
    setSecondsRemaining(nextSecs);
    setInitialSeconds(nextSecs);
    setIsActive(false);
  };

  const startNextFocusBlock = () => {
    setMode('focus');
    setPomodoroCount((prev) => prev + 1);
    setHasPlantedThisSession(false);
    const nextSecs = FOCUS_DURATION_MINUTES * 60;
    setInitialSeconds(nextSecs);
    setSecondsRemaining(nextSecs);
    setIsActive(true);
  };

  // Timer interval
  useEffect(() => {
    if (!activeTask) return;

    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => Math.max(0, sec - 1));
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      const current = stateRef.current;

      if (current.mode === 'focus') {
        // Bloom tree
        if (!current.hasPlantedThisSession && current.activeTask) {
          onPlantTree({
            taskId: current.activeTask.id,
            taskName: current.activeTask.name,
            courseId: current.activeTask.courseId,
            courseName: current.activeCourse?.name || 'Academic Course',
            courseColor: current.activeCourse?.accentHex || '#4f46e5',
            species: current.selectedSpecies,
            focusMinutes: FOCUS_DURATION_MINUTES,
          });
          setHasPlantedThisSession(true);
        }

        const newTotalFocus = current.accumulatedFocusMinutes + FOCUS_DURATION_MINUTES;
        setAccumulatedFocusMinutes(newTotalFocus);

        // 3-hour cycle check: 180 min -> 30m break, else 5m break
        if (newTotalFocus >= 180) {
          setMode('long_break');
          const nextSecs = LONG_BREAK_MINUTES * 60;
          setInitialSeconds(nextSecs);
          setSecondsRemaining(nextSecs);
          setIsActive(true);
          setAccumulatedFocusMinutes(0);
        } else {
          setMode('short_break');
          const nextSecs = SHORT_BREAK_MINUTES * 60;
          setInitialSeconds(nextSecs);
          setSecondsRemaining(nextSecs);
          setIsActive(true);
        }
      } else {
        // Break finished! Return to focus
        setMode('focus');
        setPomodoroCount((prev) => prev + 1);
        setHasPlantedThisSession(false);
        const nextSecs = FOCUS_DURATION_MINUTES * 60;
        setInitialSeconds(nextSecs);
        setSecondsRemaining(nextSecs);
        setIsActive(true);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, activeTask, onPlantTree]);

  const progressPercent =
    initialSeconds > 0
      ? Math.min(100, Math.round(((initialSeconds - secondsRemaining) / initialSeconds) * 100))
      : 0;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return {
    activeTask,
    activeCourse,
    isMinimized,
    secondsRemaining,
    initialSeconds,
    isActive,
    mode,
    selectedSpecies,
    pomodoroCount,
    accumulatedFocusMinutes,
    hasPlantedThisSession,
    progressPercent,
    formattedTime,
    setSelectedSpecies,
    startSession,
    pauseSession,
    resumeSession,
    toggleActive,
    minimizeSession,
    expandSession,
    abandonSession,
    finishAndComplete,
    addFiveMinutes,
    resetTimer,
    startNextFocusBlock,
  };
}

export type FocusSessionController = ReturnType<typeof useFocusSession>;
