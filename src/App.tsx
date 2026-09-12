import React, { useState, useEffect } from 'react';
import {
  NavScreen,
  Course,
  Task,
  TodayPlanItem,
  PlannedSession,
  StudyAvailability,
  StudentProfile,
  PlantedTree,
  TreeSpecies,
  CollegeLecture,
  CollegeCommute,
  CourseMaterial,
} from './types';
import {
  INITIAL_COURSES,
  INITIAL_TASKS,
  INITIAL_TODAY_PLAN,
  INITIAL_WEEKLY_PLAN,
  INITIAL_AVAILABILITY,
  INITIAL_STUDENT_PROFILE,
  INITIAL_PLANTED_TREES,
  INITIAL_COLLEGE_LECTURES,
  INITIAL_COLLEGE_COMMUTE,
  INITIAL_MATERIALS,
} from './data/initialData';
import { DEFAULT_UNLOCKED_SPECIES } from './data/treeSpecies';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MyTasks } from './components/MyTasks';
import { Courses } from './components/Courses';
import { Materials } from './components/Materials';
import { SessionBlueprintDrawer } from './components/SessionBlueprintDrawer';
import { UnfinishedTaskRolloverBanner } from './components/UnfinishedTaskRolloverBanner';
import { Planner } from './components/Planner';
import { Forest } from './components/Forest';
import { Progress } from './components/Progress';
import { Settings } from './components/Settings';
import { Store } from './components/Store';
import { AddTaskModal } from './components/AddTaskModal';
import { AddCourseModal } from './components/AddCourseModal';
import { FocusSessionModal } from './components/FocusSessionModal';
import { FloatingFocusWidget } from './components/FloatingFocusWidget';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CollegeScheduleModal } from './components/CollegeScheduleModal';
import { AssessmentCheckModal } from './components/AssessmentCheckModal';
import { PlanPreviewModal } from './components/PlanPreviewModal';
import { ScorePromptModal } from './components/ScorePromptModal';
import { BetaBanner } from './components/BetaBanner';
import { FeedbackModal } from './components/FeedbackModal';
import '@uploadthing/react/styles.css';
import { generateRemedialTasksForExam } from './utils/gradeCalculator';
import { AuthScreen } from './components/AuthScreen';
import { AuthProvider, useAuth, AuthUser } from './contexts/AuthContext';
import { useFocusSession } from './hooks/useFocusSession';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';
import {
  subscribeToUserData,
  saveTaskToDb,
  deleteTaskFromDb,
  saveCourseToDb,
  deleteCourseFromDb,
  savePlantedTreeToDb,
  saveLecturesToDb,
  updateUserProfileDoc,
  clearAllUserData,
  populateSampleData,
  saveBatchScannedWorkspaceData,
  saveMaterialToDb,
  deleteMaterialFromDb,
} from './services/firestoreService';
import { ScannedTimetableResult } from './services/timetableScannerService';
import { calculateSmartPriority, rebalanceWeeklyPlanWithSchedule, generateSmartStudyPlanFromLecturesAndCourses, SmartStudyPlanGenerationResult } from './utils/smartPlanner';
import { CheckCircle, GraduationCap, Loader2 } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl shadow-xl shadow-indigo-600/20 mb-4 animate-bounce overflow-hidden bg-white ring-4 ring-indigo-100">
          <img
            src="/logo.png"
            alt="StudyFlow"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Synchronizing student workspace...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return <StudyFlowMainApp key={currentUser.uid} currentUser={currentUser} />;
}

interface StudyFlowMainAppProps {
  currentUser: AuthUser;
}

const StudyFlowMainApp: React.FC<StudyFlowMainAppProps> = ({ currentUser }) => {
  const { logout } = useAuth();

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('dashboard');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('studyflow_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark class on <html> element whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('studyflow_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('studyflow_dark_mode', 'false');
    }
  }, [darkMode]);

  const handleToggleDarkMode = (isDark: boolean) => {
    setDarkMode(isDark);
    showToast(isDark ? 'Switched to Dark Mode!' : 'Switched to Light Mode!');
  };

  // Student State (starts empty for genuine student accounts, synced in real-time via Firestore/local cache)
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayPlan, setTodayPlan] = useState<TodayPlanItem[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<PlannedSession[]>([]);
  const [availability, setAvailability] = useState<StudyAvailability>(INITIAL_AVAILABILITY);
  const [profile, setProfile] = useState<StudentProfile>({
    ...INITIAL_STUDENT_PROFILE,
    name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
  });
  const [plantedTrees, setPlantedTrees] = useState<PlantedTree[]>([]);
  const [lectures, setLectures] = useState<CollegeLecture[]>([]);
  const [commute, setCommute] = useState<CollegeCommute>(INITIAL_COLLEGE_COMMUTE);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [coins, setCoins] = useState<number>(0);
  const [unlockedSpecies, setUnlockedSpecies] = useState<TreeSpecies[]>(DEFAULT_UNLOCKED_SPECIES);

  // Modal & Drawer states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isCollegeScheduleOpen, setIsCollegeScheduleOpen] = useState(false);
  const [activeAssessmentTask, setActiveAssessmentTask] = useState<Task | null>(null);
  const [blueprintTask, setBlueprintTask] = useState<Task | null>(null);
  const [isMainTaskVisible, setIsMainTaskVisible] = useState<boolean>(true);
  const [draftPlanResult, setDraftPlanResult] = useState<SmartStudyPlanGenerationResult | null>(null);
  const [isPlanPreviewOpen, setIsPlanPreviewOpen] = useState(false);
  const [taskForScorePrompt, setTaskForScorePrompt] = useState<Task | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real-time Firestore sync subscription
  useEffect(() => {
    const unsubscribe = subscribeToUserData(
      currentUser.uid,
      (data) => {
        if (data.courses) setCourses(data.courses);
        if (data.tasks) setTasks(data.tasks);
        if (data.plantedTrees) setPlantedTrees(data.plantedTrees);
        if (data.lectures) setLectures(data.lectures);
        if (data.materials) setMaterials(data.materials);
        if (data.profile) setProfile(data.profile);
        if (data.availability) setAvailability(data.availability);
        if (data.commute) setCommute(data.commute);
        if (data.coins !== undefined) setCoins(data.coins);
        if (data.unlockedSpecies) setUnlockedSpecies(data.unlockedSpecies);
        if (data.todayPlan) setTodayPlan(data.todayPlan);
        if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
      },
      (err) => {
        console.warn('Firestore subscription status:', err.message || err);
      }
    );

    return () => unsubscribe();
  }, [currentUser.uid]);

  // Handle Plant Tree from Pomodoro Completion
  const handlePlantTree = (newTree: Omit<PlantedTree, 'id' | 'plantedAt' | 'weekNumber' | 'dayOfWeek' | 'month' | 'status'>) => {
    const fullTree: PlantedTree = {
      ...newTree,
      id: `tree-${Date.now()}`,
      plantedAt: new Date().toISOString(),
      weekNumber: 1,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      month: new Date().toLocaleDateString('en-US', { month: 'short' }),
      status: 'healthy',
    };
    setPlantedTrees((prev) => [fullTree, ...prev]);
    savePlantedTreeToDb(currentUser.uid, fullTree);
    showToast(`🌲 A ${newTree.species} bloomed in your forest!`);
  };

  const handleAbandonTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.status === 'in_progress') {
          const reverted: Task = { ...t, status: 'todo' };
          saveTaskToDb(currentUser.uid, reverted);
          return reverted;
        }
        return t;
      })
    );
  };

  // Centralized Pomodoro focus session controller
  const focusSession = useFocusSession(
    handlePlantTree,
    (taskId) => handleToggleTaskComplete(taskId),
    unlockedSpecies,
    handleAbandonTask
  );

  const isAnyModalOpen =
    isAddTaskOpen ||
    isAddCourseOpen ||
    isCollegeScheduleOpen ||
    !!activeAssessmentTask ||
    !!blueprintTask ||
    isPlanPreviewOpen ||
    !!taskForScorePrompt ||
    isFeedbackOpen ||
    Boolean(focusSession.activeTask && !focusSession.isMinimized);

  useBodyScrollLock(isAnyModalOpen);

  // Unlock Species from Store
  const handleUnlockSpecies = (speciesId: TreeSpecies, price: number): boolean => {
    if (coins < price) {
      showToast(`⚠️ Need ${price - coins} more Study Coins to unlock ${speciesId}!`);
      return false;
    }
    if (unlockedSpecies.includes(speciesId)) {
      showToast(`Already unlocked ${speciesId}!`);
      return true;
    }
    const nextCoins = coins - price;
    const nextSpecies = [...unlockedSpecies, speciesId];
    setCoins(nextCoins);
    setUnlockedSpecies(nextSpecies);
    updateUserProfileDoc(currentUser.uid, { coins: nextCoins, unlockedSpecies: nextSpecies });
    showToast(`🎉 Unlocked ${speciesId}! You can now grow it in Pomodoro focus sessions.`);
    return true;
  };

  // Start Focus Task: updates system status to 'in_progress'
  const handleStartTask = (task: Task) => {
    if (task.type === 'Exam' || task.type === 'Quiz') {
      setActiveAssessmentTask(task);
    } else {
      // Safety guard 1: If THIS exact task is already the active focus task, simply expand the session!
      if (focusSession.activeTask?.id === task.id) {
        focusSession.expandSession();
        return;
      }

      // Safety guard 2: If another task is already in progress in focusSession, alert user and show the running session
      if (focusSession.activeTask) {
        showToast(`⚠️ Another focus session ("${focusSession.activeTask.name}") is currently active. Please pause or finish it first.`);
        focusSession.expandSession();
        return;
      }

      const updatedTask: Task = { ...task, status: 'in_progress' };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
      saveTaskToDb(currentUser.uid, updatedTask);

      const course = courses.find((c) => c.id === task.courseId);
      focusSession.startSession(updatedTask, course);
      showToast(`Started focus session for "${task.name}"`);
    }
  };

  // Toggle Task Complete (Award 5 coins per 60 min & dynamically rebalance uncompleted tasks)
  const handleToggleTaskComplete = (taskId: string) => {
    let updatedTask: Task | null = null;
    let nextTasks: Task[] = [];

    setTasks((prevTasks) => {
      const target = prevTasks.find((t) => t.id === taskId);
      if (!target) return prevTasks;

      const isMarkingComplete = target.status !== 'completed';
      if (isMarkingComplete) {
        const estMinutes = target.estimatedMinutes || 60;
        const earnedCoins = Math.max(1, Math.round((estMinutes / 60) * 5));
        setCoins((prevCoins) => {
          const nextCoins = prevCoins + earnedCoins;
          updateUserProfileDoc(currentUser.uid, { coins: nextCoins });
          return nextCoins;
        });
        showToast(`🎉 Completed "${target.name}"! +${earnedCoins} Study Coins earned (${estMinutes}m study) 🪙`);

        // Prompt for score if Exam/Quiz or has maxGrade and no score yet
        if (
          (target.type === 'Exam' || target.type === 'Quiz' || typeof target.maxGrade === 'number') &&
          target.achievedGrade == null
        ) {
          setTimeout(() => {
            setTaskForScorePrompt(target);
          }, 350);
        }
      }

      nextTasks = prevTasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completed' ? 'todo' : 'completed';
          updatedTask = {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
          };
          return updatedTask;
        }
        return t;
      });

      return nextTasks;
    });

    if (updatedTask) {
      saveTaskToDb(currentUser.uid, updatedTask);
    }

    // Dynamic auto-rebalancing: redistribute remaining uncompleted tasks across available study windows
    if (nextTasks.length > 0) {
      const rebalanceResult = generateSmartStudyPlanFromLecturesAndCourses({
        existingCourses: courses,
        existingTasks: nextTasks,
        lectures,
        commute,
        suggestedDailyHours: availability.dailyHours,
      });

      setWeeklyPlan(rebalanceResult.weeklyPlan);
      setTodayPlan(rebalanceResult.todayPlan);
      updateUserProfileDoc(currentUser.uid, {
        weeklyPlan: rebalanceResult.weeklyPlan,
        todayPlan: rebalanceResult.todayPlan,
      });
    }
  };

  // Handle Save Score from Post-Exam Prompt / Score Modal
  const handleSaveScore = (
    taskId: string,
    achievedGrade: number,
    maxGrade?: number,
    weightPercentage?: number
  ) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const resolvedMax = maxGrade || targetTask.maxGrade || 100;
    const resolvedWeight = weightPercentage ?? targetTask.weightPercentage;
    const percentage = Math.round((achievedGrade / resolvedMax) * 1000) / 10;
    const isMastered = percentage >= 80;
    const masteryStatus = isMastered ? 'Mastered' : 'Requires Remediation';

    const updatedTask: Task = {
      ...targetTask,
      achievedGrade,
      maxGrade: resolvedMax,
      weightPercentage: resolvedWeight,
      conceptMasteryStatus: masteryStatus,
      status: 'completed',
      completedAt: targetTask.completedAt || new Date().toISOString(),
    };

    saveTaskToDb(currentUser.uid, updatedTask);

    let updatedTasksList = tasks.map((t) => (t.id === taskId ? updatedTask : t));

    if (!isMastered) {
      // Adaptive Remedial Scheduling: score below 80% triggers targeted review and practice tasks
      const course = courses.find((c) => c.id === targetTask.courseId);
      const remedialTasks = generateRemedialTasksForExam(targetTask, course, materials);

      for (const remTask of remedialTasks) {
        saveTaskToDb(currentUser.uid, remTask);
      }

      updatedTasksList = [...updatedTasksList, ...remedialTasks];

      const rebalanceResult = generateSmartStudyPlanFromLecturesAndCourses({
        existingCourses: courses,
        existingTasks: updatedTasksList,
        lectures,
        commute,
        suggestedDailyHours: availability.dailyHours,
      });

      setTasks(updatedTasksList);
      setWeeklyPlan(rebalanceResult.weeklyPlan);
      setTodayPlan(rebalanceResult.todayPlan);
      updateUserProfileDoc(currentUser.uid, {
        weeklyPlan: rebalanceResult.weeklyPlan,
        todayPlan: rebalanceResult.todayPlan,
      });

      showToast(
        `⚠️ Score: ${percentage}% (<80%). Scheduled 2 Adaptive Remedial Review sessions into your study plan! 🎯`
      );
    } else {
      const rebalanceResult = generateSmartStudyPlanFromLecturesAndCourses({
        existingCourses: courses,
        existingTasks: updatedTasksList,
        lectures,
        commute,
        suggestedDailyHours: availability.dailyHours,
      });

      setTasks(updatedTasksList);
      setWeeklyPlan(rebalanceResult.weeklyPlan);
      setTodayPlan(rebalanceResult.todayPlan);
      updateUserProfileDoc(currentUser.uid, {
        weeklyPlan: rebalanceResult.weeklyPlan,
        todayPlan: rebalanceResult.todayPlan,
      });

      showToast(
        `🎉 Mastered! Score: ${percentage}% (≥80%). Course running percentage updated! ⭐`
      );
    }

    setTaskForScorePrompt(null);
  };

  // Toggle plan item complete
  const handleTogglePlanItemComplete = (planItemId: string) => {
    setTodayPlan((prev) => {
      const item = prev.find((i) => i.id === planItemId);
      if (item && !item.completed) {
        const duration = item.durationMinutes || 60;
        const earnedCoins = Math.max(1, Math.round((duration / 60) * 5));
        setCoins((prevCoins) => {
          const next = prevCoins + earnedCoins;
          updateUserProfileDoc(currentUser.uid, { coins: next });
          return next;
        });
        showToast(`Plan task completed! +${earnedCoins} Study Coins earned (${duration}m study) 🪙`);
      }
      const updated = prev.map((item) =>
        item.id === planItemId ? { ...item, completed: !item.completed } : item
      );
      updateUserProfileDoc(currentUser.uid, { todayPlan: updated });
      return updated;
    });
  };

  // Toggle weekly plan session complete
  const handleToggleSessionComplete = (sessionId: string) => {
    setWeeklyPlan((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId ? { ...session, completed: !session.completed } : session
      );
      updateUserProfileDoc(currentUser.uid, { weeklyPlan: updated });
      return updated;
    });
  };

  // Reschedule skipped task
  const handleRescheduleTask = (
    taskId: string,
    option: 'tomorrow' | 'friday' | 'weekend' | 'next_week'
  ) => {
    setTodayPlan((prev) => {
      const updated = prev.filter((item) => item.taskId !== taskId);
      updateUserProfileDoc(currentUser.uid, { todayPlan: updated });
      return updated;
    });

    const now = new Date();
    const targetDate = new Date(now);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

    if (option === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (option === 'friday') {
      const currentDay = now.getDay();
      const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + daysUntilFriday);
    } else if (option === 'weekend') {
      const currentDay = now.getDay();
      const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + daysUntilSaturday);
    } else {
      targetDate.setDate(targetDate.getDate() + 7);
    }

    const targetDay = (dayNames[targetDate.getDay()] || 'Monday') as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    const newDeadlineStr = `${targetDate.toISOString().slice(0, 10)}T23:59`;

    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          const modTask = { ...t, deadline: newDeadlineStr };
          saveTaskToDb(currentUser.uid, modTask);
          return modTask;
        }
        return t;
      });
      return updated;
    });

    setWeeklyPlan((prev) => {
      const filtered = prev.filter((s) => s.taskId !== taskId);
      const targetTask = tasks.find((t) => t.id === taskId);
      const updated = [
        ...filtered,
        {
          id: `rescheduled-${taskId}-${Date.now()}`,
          taskId,
          day: targetDay,
          timeSlot: '16:00',
          durationMinutes: targetTask?.estimatedMinutes || 45,
          completed: false,
        },
      ];
      updateUserProfileDoc(currentUser.uid, { weeklyPlan: updated });
      return updated;
    });

    const targetTask = tasks.find((t) => t.id === taskId);
    showToast(`Rescheduled "${targetTask?.name || 'Task'}" to ${targetDay}`);
  };

  // Add Task
  const handleAddTask = (newTask: Task) => {
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    saveTaskToDb(currentUser.uid, newTask);
    showToast(`Added "${newTask.name}" (Priority: ${newTask.smartPriorityScore}/100)`);

    // Dynamically remake study plan to incorporate the new assignment, quiz, or study task and its deadline!
    const planResult = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: courses,
      existingTasks: updatedTasks,
      lectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
    });

    setWeeklyPlan(planResult.weeklyPlan);
    setTodayPlan(planResult.todayPlan);
    updateUserProfileDoc(currentUser.uid, {
      weeklyPlan: planResult.weeklyPlan,
      todayPlan: planResult.todayPlan,
    });
  };

  // Quick Capture Task Converter
  const handleQuickCaptureAddTask = (taskData: Partial<Task>) => {
    const course = courses.find((c) => c.id === taskData.courseId) || courses[0];
    const createdTask: Task = {
      id: `task-${Date.now()}`,
      name: taskData.name || 'Quick Takeaway Task',
      courseId: course?.id || 'gen',
      type: taskData.type || 'Study',
      deadline: taskData.deadline || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      estimatedMinutes: taskData.estimatedMinutes || 30,
      importance: 3,
      difficulty: 3,
      notes: taskData.notes || '',
      status: 'todo',
      smartPriorityScore: 75,
      materialId: taskData.materialId,
      materialTitle: taskData.materialTitle,
    };
    handleAddTask(createdTask);
  };

  // Add Course
  const handleAddCourse = (newCourse: Course) => {
    const updatedCourses = [...courses, newCourse];
    setCourses(updatedCourses);
    saveCourseToDb(currentUser.uid, newCourse);
    showToast(`Added course "${newCourse.name}" (${newCourse.code})`);

    // Automatically generate study sessions for the new course if lectures exist
    const planResult = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: updatedCourses,
      existingTasks: tasks,
      lectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
    });
    setTasks(planResult.allTasks);
    setWeeklyPlan(planResult.weeklyPlan);
    setTodayPlan(planResult.todayPlan);
    saveBatchScannedWorkspaceData(currentUser.uid, {
      courses: planResult.allCourses,
      tasks: planResult.allTasks,
      lectures,
      todayPlan: planResult.todayPlan,
      weeklyPlan: planResult.weeklyPlan,
      availability,
    });
  };

  // Delete Course
  const handleDeleteCourse = (courseId: string) => {
    const courseToDelete = courses.find((c) => c.id === courseId);
    const updatedCourses = courses.filter((c) => c.id !== courseId);
    const updatedTasks = tasks.filter((t) => t.courseId !== courseId);
    const updatedLectures = lectures.filter(
      (l) => l.courseId !== courseId && l.courseName.toLowerCase() !== (courseToDelete?.name || '').toLowerCase()
    );

    setCourses(updatedCourses);
    setTasks(updatedTasks);
    setLectures(updatedLectures);

    deleteCourseFromDb(currentUser.uid, courseId);
    tasks.filter((t) => t.courseId === courseId).forEach((t) => deleteTaskFromDb(currentUser.uid, t.id));
    saveLecturesToDb(currentUser.uid, updatedLectures);

    const planResult = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: updatedCourses,
      existingTasks: updatedTasks,
      lectures: updatedLectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
    });
    setWeeklyPlan(planResult.weeklyPlan);
    setTodayPlan(planResult.todayPlan);
    updateUserProfileDoc(currentUser.uid, {
      weeklyPlan: planResult.weeklyPlan,
      todayPlan: planResult.todayPlan,
    });
    showToast(`Removed course "${courseToDelete?.name || 'Course'}" and updated your schedule.`);
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    deleteTaskFromDb(currentUser.uid, taskId);

    const planResult = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: courses,
      existingTasks: updatedTasks,
      lectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
    });
    setWeeklyPlan(planResult.weeklyPlan);
    setTodayPlan(planResult.todayPlan);
    updateUserProfileDoc(currentUser.uid, {
      weeklyPlan: planResult.weeklyPlan,
      todayPlan: planResult.todayPlan,
    });
    showToast('Task removed and study plan updated');
  };

  // Bulk Complete Tasks
  const handleBulkCompleteTasks = (taskIds: string[]) => {
    if (!taskIds.length) return;
    const idsSet = new Set(taskIds);
    let totalEarnedCoins = 0;

    const nextTasks = tasks.map((t) => {
      if (idsSet.has(t.id)) {
        const isMarkingComplete = t.status !== 'completed';
        if (isMarkingComplete) {
          const estMinutes = t.estimatedMinutes || 60;
          totalEarnedCoins += Math.max(1, Math.round((estMinutes / 60) * 5));
        }
        const nextStatus: 'completed' | 'todo' = t.status === 'completed' ? 'todo' : 'completed';
        const updated: Task = {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
        };
        saveTaskToDb(currentUser.uid, updated);
        return updated;
      }
      return t;
    });

    if (totalEarnedCoins > 0) {
      setCoins((prev) => {
        const nextCoins = prev + totalEarnedCoins;
        updateUserProfileDoc(currentUser.uid, { coins: nextCoins });
        return nextCoins;
      });
    }

    setTasks(nextTasks);

    const rebalanceResult = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: courses,
      existingTasks: nextTasks,
      lectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
    });

    setWeeklyPlan(rebalanceResult.weeklyPlan);
    setTodayPlan(rebalanceResult.todayPlan);
    updateUserProfileDoc(currentUser.uid, {
      weeklyPlan: rebalanceResult.weeklyPlan,
      todayPlan: rebalanceResult.todayPlan,
    });

    showToast(`🎉 Bulk completed ${taskIds.length} tasks! ${totalEarnedCoins > 0 ? `+${totalEarnedCoins} Study Coins 🪙` : ''}`);
  };

  // Bulk Delete Tasks
  const handleBulkDeleteTasks = (taskIds: string[]) => {
    if (!taskIds.length) return;
    const idsSet = new Set(taskIds);
    const updatedTasks = tasks.filter((t) => !idsSet.has(t.id));

    setTasks(updatedTasks);
    taskIds.forEach((id) => deleteTaskFromDb(currentUser.uid, id));

    const rebalanceResult = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: courses,
      existingTasks: updatedTasks,
      lectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
    });

    setWeeklyPlan(rebalanceResult.weeklyPlan);
    setTodayPlan(rebalanceResult.todayPlan);
    updateUserProfileDoc(currentUser.uid, {
      weeklyPlan: rebalanceResult.weeklyPlan,
      todayPlan: rebalanceResult.todayPlan,
    });

    showToast(`🗑️ Bulk deleted ${taskIds.length} tasks and updated your schedule.`);
  };

  // Apply full scanned timetable results (courses, tasks, lectures, availability, study plan)
  const handleApplyScannedSchedule = async (scanned: ScannedTimetableResult) => {
    // Merge new courses
    const updatedCourses = [...courses];
    scanned.courses.forEach((c) => {
      if (!updatedCourses.some((existing) => existing.id === c.id || existing.name.toLowerCase() === c.name.toLowerCase())) {
        updatedCourses.push(c);
      }
    });

    const updatedTasks = [...tasks, ...scanned.tasks];
    const updatedLectures = scanned.lectures;
    const updatedAvailability: StudyAvailability = {
      ...availability,
      dailyHours: scanned.suggestedDailyHours,
    };
    const updatedTodayPlan = scanned.todayPlan;
    const updatedWeeklyPlan = scanned.weeklyPlan;

    setCourses(updatedCourses);
    setTasks(updatedTasks);
    setLectures(updatedLectures);
    setAvailability(updatedAvailability);
    setTodayPlan(updatedTodayPlan);
    setWeeklyPlan(updatedWeeklyPlan);

    await saveBatchScannedWorkspaceData(currentUser.uid, {
      courses: scanned.courses,
      tasks: scanned.tasks,
      lectures: scanned.lectures,
      todayPlan: scanned.todayPlan,
      weeklyPlan: scanned.weeklyPlan,
      availability: updatedAvailability,
    });

    showToast(`Extracted ${scanned.courses.length} courses, ${scanned.tasks.length} tasks, and generated your study plan!`);
  };

  // Material CRUD Handlers
  const handleAddMaterial = async (newMat: CourseMaterial) => {
    let updated: CourseMaterial[];
    if (materials.some((m) => m.id === newMat.id)) {
      updated = materials.map((m) => (m.id === newMat.id ? newMat : m));
    } else {
      updated = [newMat, ...materials];
    }
    setMaterials(updated);
    if (currentUser) {
      await saveMaterialToDb(currentUser.uid, newMat);
    }

    // Regenerate smart plan with document grounding context
    const planResult = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: courses,
      existingTasks: tasks,
      lectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
      materials: updated,
    });
    setWeeklyPlan(planResult.weeklyPlan);
    setTodayPlan(planResult.todayPlan);
    if (currentUser) {
      await saveBatchScannedWorkspaceData(currentUser.uid, {
        courses,
        tasks,
        lectures,
        todayPlan: planResult.todayPlan,
        weeklyPlan: planResult.weeklyPlan,
        availability,
      });
    }

    showToast(`Indexed document "${newMat.title}" and grounded study sessions!`);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const updated = materials.filter((m) => m.id !== materialId);
    setMaterials(updated);
    if (currentUser) {
      await deleteMaterialFromDb(currentUser.uid, materialId);
    }
    showToast('Material removed from knowledge base');
  };

  // Generate draft plan for preview modal
  const handleRegeneratePlan = () => {
    const result = generateSmartStudyPlanFromLecturesAndCourses({
      existingCourses: courses,
      existingTasks: tasks,
      lectures,
      commute,
      suggestedDailyHours: availability.dailyHours,
      materials,
    });

    setDraftPlanResult(result);
    setIsPlanPreviewOpen(true);
  };

  // Confirm and save plan from PlanPreviewModal
  const handleConfirmApplyPlan = async (
    confirmedWeeklyPlan: PlannedSession[],
    confirmedTasks: Task[],
    confirmedTodayPlan: TodayPlanItem[]
  ) => {
    setWeeklyPlan(confirmedWeeklyPlan);
    setTasks(confirmedTasks);
    setTodayPlan(confirmedTodayPlan);

    await saveBatchScannedWorkspaceData(currentUser.uid, {
      courses,
      tasks: confirmedTasks,
      lectures,
      todayPlan: confirmedTodayPlan,
      weeklyPlan: confirmedWeeklyPlan,
      availability,
    });

    showToast(`Applied and saved customized AI Study Plan (${confirmedWeeklyPlan.length} sessions)!`);
  };

  // Handle Unfinished Task Rollover
  const handleApplyRollover = async (
    updatedTasks: Task[],
    updatedWeeklyPlan: PlannedSession[],
    updatedTodayPlan: TodayPlanItem[]
  ) => {
    setTasks(updatedTasks);
    setWeeklyPlan(updatedWeeklyPlan);
    setTodayPlan(updatedTodayPlan);

    if (currentUser) {
      await saveBatchScannedWorkspaceData(currentUser.uid, {
        courses,
        tasks: updatedTasks,
        lectures,
        todayPlan: updatedTodayPlan,
        weeklyPlan: updatedWeeklyPlan,
        availability,
      });
    }

    showToast('Rolled over and redistributed past unfinished tasks across free study windows!');
  };

  // Handle Drag-and-Drop / Quick Time Slot Update for Planned Session
  const handleUpdateSessionTimeSlot = async (sessionId: string, newTimeSlot: string) => {
    const updatedWeekly = weeklyPlan.map((s) => (s.id === sessionId ? { ...s, timeSlot: newTimeSlot } : s));
    const updatedToday = todayPlan.map((item) => (item.id === sessionId ? { ...item, timeSlot: newTimeSlot } : item));

    setWeeklyPlan(updatedWeekly);
    setTodayPlan(updatedToday);

    if (currentUser) {
      await saveBatchScannedWorkspaceData(currentUser.uid, {
        courses,
        tasks,
        lectures,
        todayPlan: updatedToday,
        weeklyPlan: updatedWeekly,
        availability,
      });
    }
  };

  // Clear all user workspace data (empty slate)
  const handleClearAllData = async () => {
    setCourses([]);
    setTasks([]);
    setTodayPlan([]);
    setWeeklyPlan([]);
    setPlantedTrees([]);
    setLectures([]);
    setCoins(0);
    await clearAllUserData(currentUser.uid);
    showToast('Your workspace is now completely empty. Ready for your courses and tasks!');
  };

  // Load sample demo data template
  const handleLoadSampleData = async () => {
    setCourses(INITIAL_COURSES);
    setTasks(INITIAL_TASKS);
    setTodayPlan(INITIAL_TODAY_PLAN);
    setWeeklyPlan(INITIAL_WEEKLY_PLAN);
    setAvailability(INITIAL_AVAILABILITY);
    setProfile(INITIAL_STUDENT_PROFILE);
    setPlantedTrees(INITIAL_PLANTED_TREES);
    setLectures(INITIAL_COLLEGE_LECTURES);
    setCommute(INITIAL_COLLEGE_COMMUTE);
    setCoins(100);
    setUnlockedSpecies(DEFAULT_UNLOCKED_SPECIES);
    await populateSampleData(currentUser.uid);
    showToast('Sample university semester demo data loaded!');
  };

  // Reset sample data
  const handleResetData = () => {
    handleLoadSampleData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500/15 selection:text-indigo-950 transition-colors duration-200">
      {/* Top Beta Announcement Banner */}
      <BetaBanner onOpenFeedback={() => setIsFeedbackOpen(true)} />

      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Navigation */}
        <Navigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          profile={profile}
          userEmail={currentUser.email || undefined}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
          treesCount={plantedTrees.length}
          coins={coins}
          onSignOut={logout}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
        {toastMessage && (
          <div
            id="global-feedback-toast"
            className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Global Past Incomplete Task Rollover Prompt Banner */}
        <UnfinishedTaskRolloverBanner
          tasks={tasks}
          courses={courses}
          weeklyPlan={weeklyPlan}
          todayPlan={todayPlan}
          availability={availability}
          lectures={lectures}
          onApplyRollover={handleApplyRollover}
        />

        {/* Screen 1: Dashboard */}
        {currentScreen === 'dashboard' && (
          <Dashboard
            tasks={tasks}
            courses={courses}
            todayPlan={todayPlan}
            availability={availability}
            profile={profile}
            lectures={lectures}
            materials={materials}
            focusSession={focusSession}
            onMainTaskVisibilityChange={setIsMainTaskVisible}
            onStartTask={handleStartTask}
            onCheckAssessment={(task) => setActiveAssessmentTask(task)}
            onToggleTaskComplete={handleToggleTaskComplete}
            onTogglePlanItemComplete={handleTogglePlanItemComplete}
            onRescheduleTask={handleRescheduleTask}
            onAddTask={handleQuickCaptureAddTask}
            onNavigateToTasks={() => setCurrentScreen('tasks')}
            onNavigateToCourses={() => setCurrentScreen('courses')}
            onNavigateToSettings={() => setCurrentScreen('settings')}
            onNavigateToForest={() => setCurrentScreen('forest')}
            onOpenCollegeSchedule={() => setIsCollegeScheduleOpen(true)}
          />
        )}

        {/* Screen 2: My Tasks */}
        {currentScreen === 'tasks' && (
          <ErrorBoundary fallbackTitle="Tasks view encountered an issue">
            <MyTasks
              tasks={tasks}
              courses={courses}
              onStartTask={handleStartTask}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              onBulkCompleteTasks={handleBulkCompleteTasks}
              onBulkDeleteTasks={handleBulkDeleteTasks}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              activeTaskId={focusSession.activeTask?.id}
              onExpandSession={focusSession.expandSession}
              onOpenScorePrompt={(task) => setTaskForScorePrompt(task)}
            />
          </ErrorBoundary>
        )}

        {/* Screen 3: Courses */}
        {currentScreen === 'courses' && (
          <ErrorBoundary fallbackTitle="Courses view encountered an issue">
            <Courses
              courses={courses}
              tasks={tasks}
              materials={materials}
              plantedTrees={plantedTrees}
              onOpenAddCourse={() => setIsAddCourseOpen(true)}
              onSelectCourseTasks={() => setCurrentScreen('tasks')}
              onDeleteCourse={handleDeleteCourse}
              onStartTask={handleStartTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onOpenAddTaskForCourse={() => setIsAddTaskOpen(true)}
              onAddMaterial={handleAddMaterial}
              onLoadSampleData={handleLoadSampleData}
              activeTaskId={focusSession.activeTask?.id}
              onExpandSession={focusSession.expandSession}
            />
          </ErrorBoundary>
        )}

        {/* Screen 3.5: Materials & Knowledge Base */}
        {currentScreen === 'materials' && (
          <ErrorBoundary fallbackTitle="Materials view encountered an issue">
            <Materials
              courses={courses}
              materials={materials}
              tasks={tasks}
              onAddMaterial={handleAddMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onStartFocusSession={handleStartTask}
            />
          </ErrorBoundary>
        )}

        {/* Screen 4: Planner */}
        {currentScreen === 'planner' && (
          <ErrorBoundary fallbackTitle="Planner view encountered an issue">
            <Planner
              weeklyPlan={weeklyPlan}
              tasks={tasks}
              courses={courses}
              availability={availability}
              lectures={lectures}
              onToggleSessionComplete={handleToggleSessionComplete}
              onRegeneratePlan={handleRegeneratePlan}
              onOpenCollegeSchedule={() => setIsCollegeScheduleOpen(true)}
              onCheckAssessment={(task) => setActiveAssessmentTask(task)}
              onStartTask={handleStartTask}
              onUpdateSessionTimeSlot={handleUpdateSessionTimeSlot}
              activeTaskId={focusSession.activeTask?.id}
              onExpandSession={focusSession.expandSession}
            />
          </ErrorBoundary>
        )}

        {/* Screen 5: Forest (Grove of Focus) */}
        {currentScreen === 'forest' && (
          <Forest
            plantedTrees={plantedTrees}
            courses={courses}
            onOpenFocusModal={() => {
              const activeTask = tasks.find((t) => t.status !== 'completed') || tasks[0];
              if (activeTask) handleStartTask(activeTask);
            }}
          />
        )}

        {/* Screen 6: Store (Species Unlock) */}
        {currentScreen === 'store' && (
          <Store
            coins={coins}
            unlockedSpecies={unlockedSpecies}
            onUnlockSpecies={handleUnlockSpecies}
            onNavigateToForest={() => setCurrentScreen('forest')}
            onNavigateToTasks={() => setCurrentScreen('tasks')}
          />
        )}

        {/* Screen 7: Progress */}
        {currentScreen === 'progress' && (
          <Progress
            tasks={tasks}
            courses={courses}
            onOpenScorePrompt={(task) => setTaskForScorePrompt(task)}
            onUpdateTaskGrade={(taskId, achievedGrade, maxGrade, weightPercentage) => {
              const targetTask = tasks.find((t) => t.id === taskId);
              if (!targetTask) return;
              handleSaveScore(taskId, achievedGrade, maxGrade, weightPercentage);
            }}
          />
        )}

        {/* Screen 8: Settings */}
        {currentScreen === 'settings' && (
          <Settings
            availability={availability}
            profile={profile}
            userEmail={currentUser.email || undefined}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onUpdateAvailability={(newAvail) => {
              setAvailability(newAvail);

              // Dynamically re-calculate and redistribute uncompleted tasks across newly configured daily study capacity windows
              const rebalanceResult = generateSmartStudyPlanFromLecturesAndCourses({
                existingCourses: courses,
                existingTasks: tasks,
                lectures,
                commute,
                suggestedDailyHours: newAvail.dailyHours,
              });

              setWeeklyPlan(rebalanceResult.weeklyPlan);
              setTodayPlan(rebalanceResult.todayPlan);

              updateUserProfileDoc(currentUser.uid, {
                availability: newAvail,
                weeklyPlan: rebalanceResult.weeklyPlan,
                todayPlan: rebalanceResult.todayPlan,
              });
              showToast('Updated study capacity & redistributed weekly schedule!');
            }}
            onUpdateProfile={(newProf) => {
              setProfile(newProf);
              updateUserProfileDoc(currentUser.uid, { profile: newProf });
              showToast('Updated student profile!');
            }}
            onClearData={handleClearAllData}
            onLoadSampleData={handleLoadSampleData}
            onResetData={handleResetData}
            onSignOut={logout}
          />
        )}
      </main>
      </div>

      {/* Session Blueprint Drawer */}
      {blueprintTask && (
        <SessionBlueprintDrawer
          task={blueprintTask}
          courses={courses}
          materials={materials}
          onClose={() => setBlueprintTask(null)}
          onStartFocusSession={handleStartTask}
          onToggleTaskComplete={handleToggleTaskComplete}
          activeTaskId={focusSession.activeTask?.id}
          onExpandSession={focusSession.expandSession}
        />
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        courses={courses}
        onAddTask={handleAddTask}
      />

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddCourseOpen}
        onClose={() => setIsAddCourseOpen(false)}
        onAddCourse={handleAddCourse}
      />

      {/* Floating Focus Widget: ONLY visible when main task icon is NOT visible */}
      {focusSession.activeTask && focusSession.isMinimized && (currentScreen !== 'dashboard' || !isMainTaskVisible) && (
        <FloatingFocusWidget
          task={focusSession.activeTask}
          mode={focusSession.mode}
          secondsRemaining={focusSession.secondsRemaining}
          formattedTime={focusSession.formattedTime}
          progressPercent={focusSession.progressPercent}
          isActive={focusSession.isActive}
          selectedSpecies={focusSession.selectedSpecies}
          onToggleActive={focusSession.toggleActive}
          onExpand={focusSession.expandSession}
        />
      )}

      {/* Active Focus Session Timer Modal (Strict 30m Pomodoro with breaks) */}
      <FocusSessionModal
        isOpen={Boolean(focusSession.activeTask && !focusSession.isMinimized)}
        focusSession={focusSession}
        unlockedSpecies={unlockedSpecies}
        coins={coins}
        onNavigateToStore={() => setCurrentScreen('store')}
      />

      {/* College Schedule Modal (Lectures & Commute Input) */}
      <CollegeScheduleModal
        isOpen={isCollegeScheduleOpen}
        onClose={() => setIsCollegeScheduleOpen(false)}
        courses={courses}
        tasks={tasks}
        lectures={lectures}
        commute={commute}
        availability={availability}
        onUpdateLectures={(newLectures) => {
          setLectures(newLectures);
          saveLecturesToDb(currentUser.uid, newLectures);
        }}
        onUpdateCommute={(newCommute) => {
          setCommute(newCommute);
          updateUserProfileDoc(currentUser.uid, { commute: newCommute });
        }}
        onApplySuggestedAvailability={async (newDailyHours, autoGenerateTasks = true) => {
          const result = generateSmartStudyPlanFromLecturesAndCourses({
            existingCourses: courses,
            existingTasks: tasks,
            lectures,
            commute,
            suggestedDailyHours: newDailyHours,
            autoGenerateTasks,
          });

          setCourses(result.allCourses);
          setTasks(result.allTasks);
          setWeeklyPlan(result.weeklyPlan);
          setTodayPlan(result.todayPlan);
          setAvailability(result.availability);

          await saveBatchScannedWorkspaceData(currentUser.uid, {
            courses: result.allCourses,
            tasks: result.allTasks,
            lectures,
            todayPlan: result.todayPlan,
            weeklyPlan: result.weeklyPlan,
            availability: result.availability,
          });

          if (result.newTasks.length > 0) {
            showToast(`Generated study plan with ${result.newTasks.length} review tasks fitted to your schedule!`);
          } else {
            showToast('Study plan rebalanced around your college lectures, commute, and free hours!');
          }
        }}
        onApplyScannedSchedule={handleApplyScannedSchedule}
      />

      {/* Assessment Untimed Check Modal (for Exams & Quizzes) */}
      <AssessmentCheckModal
        isOpen={!!activeAssessmentTask}
        task={activeAssessmentTask}
        course={activeAssessmentTask ? courses.find((c) => c.id === activeAssessmentTask.courseId) || null : null}
        onClose={() => setActiveAssessmentTask(null)}
        onCompleteTask={(taskId) => {
          handleToggleTaskComplete(taskId);
          setActiveAssessmentTask(null);
        }}
      />

      {/* Plan Preview & Draft Review Modal */}
      <PlanPreviewModal
        isOpen={isPlanPreviewOpen}
        onClose={() => setIsPlanPreviewOpen(false)}
        draftResult={draftPlanResult}
        courses={courses}
        tasks={tasks}
        onConfirmApplyPlan={handleConfirmApplyPlan}
      />

      {/* Post-Exam Score Check & Adaptive Remedial Prompt Modal */}
      <ScorePromptModal
        isOpen={!!taskForScorePrompt}
        onClose={() => setTaskForScorePrompt(null)}
        task={taskForScorePrompt}
        courses={courses}
        onSaveScore={handleSaveScore}
      />

      {/* User Feedback Drawer / Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        userId={currentUser.uid}
        userEmail={currentUser.email || ''}
        onSuccessToast={showToast}
      />
    </div>
  );
}
