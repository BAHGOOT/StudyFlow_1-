import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Course,
  Task,
  TodayPlanItem,
  PlannedSession,
  StudyAvailability,
  StudentProfile,
  PlantedTree,
  CollegeLecture,
  CollegeCommute,
  TreeSpecies,
} from '../types';
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
} from '../data/initialData';
import { DEFAULT_UNLOCKED_SPECIES } from '../data/treeSpecies';

export interface UserDataState {
  profile: StudentProfile;
  courses: Course[];
  tasks: Task[];
  todayPlan: TodayPlanItem[];
  weeklyPlan: PlannedSession[];
  availability: StudyAvailability;
  plantedTrees: PlantedTree[];
  lectures: CollegeLecture[];
  commute: CollegeCommute;
  coins: number;
  unlockedSpecies: TreeSpecies[];
}

const getLocalUserStorageKey = (userId: string) => `studyflow_userdata_${userId}`;

/**
 * Recursively remove `undefined` values and sanitize payloads so Firestore setDoc/updateDoc never fails
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as unknown as T;
  }
  return obj;
}

export function getLocalUserState(userId: string): Partial<UserDataState> | null {
  try {
    const raw = localStorage.getItem(getLocalUserStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalUserState(userId: string, update: Partial<UserDataState>) {
  try {
    const current = getLocalUserState(userId) || {};
    const merged = { ...current, ...update };
    localStorage.setItem(getLocalUserStorageKey(userId), JSON.stringify(merged));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

/**
 * Initialize user account in Firestore.
 * By default for real new accounts: EMPTY workspace (no courses, no tasks, clean forest).
 * If isDemo is true (demo profiles): pre-seeds sample workload data.
 */
export const ADMIN_EMAILS = [
  'mohamedelkoramy97@gmail.com',
];

export const isAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === clean);
};

export async function initializeUserAccount(
  userId: string,
  email: string,
  displayName?: string,
  major?: string,
  university?: string,
  isDemo = false
): Promise<void> {
  const isAdmin = isAdminEmail(email);

  const customProfile: StudentProfile = {
    ...INITIAL_STUDENT_PROFILE,
    name: displayName || email.split('@')[0] || (isAdmin ? 'Admin' : 'Student'),
    major: major || (isAdmin ? 'Computer Science & Engineering' : 'General Studies'),
    tier: isAdmin ? 'Administrator' : 'Student Free',
    email,
    role: isAdmin ? 'admin' : 'student',
  };

  const initialCourses = isDemo ? INITIAL_COURSES : [];
  const initialTasks = isDemo ? INITIAL_TASKS : [];
  const initialTrees = isDemo ? INITIAL_PLANTED_TREES : [];
  const initialLectures = isDemo ? INITIAL_COLLEGE_LECTURES : [];
  const initialTodayPlan = isDemo ? INITIAL_TODAY_PLAN : [];
  const initialWeeklyPlan = isDemo ? INITIAL_WEEKLY_PLAN : [];
  const initialCoins = isDemo ? 100 : (isAdmin ? 500 : 0);

  // Attempt to initialize in Firestore
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // User already exists in Firestore -> Cache existing profile/plan in local storage
      const d = userDocSnap.data();
      saveLocalUserState(userId, {
        profile: d.profile || customProfile,
        availability: d.availability || INITIAL_AVAILABILITY,
        commute: d.commute || INITIAL_COLLEGE_COMMUTE,
        coins: d.coins ?? 0,
        unlockedSpecies: d.unlockedSpecies || DEFAULT_UNLOCKED_SPECIES,
        todayPlan: d.todayPlan || [],
        weeklyPlan: d.weeklyPlan || [],
      });
    } else {
      // Initialize local cache for new user
      saveLocalUserState(userId, {
        profile: customProfile,
        courses: initialCourses,
        tasks: initialTasks,
        todayPlan: initialTodayPlan,
        weeklyPlan: initialWeeklyPlan,
        availability: INITIAL_AVAILABILITY,
        plantedTrees: initialTrees,
        lectures: initialLectures,
        commute: INITIAL_COLLEGE_COMMUTE,
        coins: initialCoins,
        unlockedSpecies: DEFAULT_UNLOCKED_SPECIES,
      });

      await setDoc(userDocRef, cleanForFirestore({
        email,
        displayName: customProfile.name,
        role: customProfile.role || (isAdmin ? 'admin' : 'student'),
        coins: initialCoins,
        unlockedSpecies: DEFAULT_UNLOCKED_SPECIES,
        profile: customProfile,
        availability: INITIAL_AVAILABILITY,
        commute: INITIAL_COLLEGE_COMMUTE,
        todayPlan: initialTodayPlan,
        weeklyPlan: initialWeeklyPlan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }), { merge: true });

      // Only seed subcollections if demo account requested
      if (isDemo) {
        for (const course of INITIAL_COURSES) {
          await setDoc(doc(db, 'users', userId, 'courses', course.id), cleanForFirestore(course), { merge: true });
        }
        for (const task of INITIAL_TASKS) {
          await setDoc(doc(db, 'users', userId, 'tasks', task.id), cleanForFirestore(task), { merge: true });
        }
        for (const tree of INITIAL_PLANTED_TREES) {
          await setDoc(doc(db, 'users', userId, 'plantedTrees', tree.id), cleanForFirestore(tree), { merge: true });
        }
        for (const lecture of INITIAL_COLLEGE_LECTURES) {
          await setDoc(doc(db, 'users', userId, 'lectures', lecture.id), cleanForFirestore(lecture), { merge: true });
        }
      }
    }
  } catch (err) {
    console.warn('Firestore user init notification:', err);
  }
}

/**
 * Reset / Wipe all workspace data for an empty clean start
 */
export async function clearAllUserData(userId: string): Promise<void> {
  const emptyState: Partial<UserDataState> = {
    courses: [],
    tasks: [],
    todayPlan: [],
    weeklyPlan: [],
    plantedTrees: [],
    lectures: [],
    coins: 0,
    unlockedSpecies: DEFAULT_UNLOCKED_SPECIES,
  };

  saveLocalUserState(userId, emptyState);

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, cleanForFirestore({
      ...emptyState,
      updatedAt: new Date().toISOString(),
    }), { merge: true });

    // Delete existing subcollections documents
    const subcollections = ['courses', 'tasks', 'plantedTrees', 'lectures'];
    for (const sub of subcollections) {
      const collRef = collection(db, 'users', userId, sub);
      const snaps = await getDocs(collRef);
      for (const d of snaps.docs) {
        await deleteDoc(d.ref);
      }
    }
  } catch (err) {
    console.warn('Error clearing Firestore data:', err);
  }
}

/**
 * Load Sample Demo Workload Data into the user's workspace
 */
export async function populateSampleData(userId: string): Promise<void> {
  const sampleState: Partial<UserDataState> = {
    courses: INITIAL_COURSES,
    tasks: INITIAL_TASKS,
    todayPlan: INITIAL_TODAY_PLAN,
    weeklyPlan: INITIAL_WEEKLY_PLAN,
    plantedTrees: INITIAL_PLANTED_TREES,
    lectures: INITIAL_COLLEGE_LECTURES,
    coins: 100,
    unlockedSpecies: DEFAULT_UNLOCKED_SPECIES,
  };

  saveLocalUserState(userId, sampleState);

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, cleanForFirestore({
      ...sampleState,
      updatedAt: new Date().toISOString(),
    }), { merge: true });

    for (const course of INITIAL_COURSES) {
      await setDoc(doc(db, 'users', userId, 'courses', course.id), cleanForFirestore(course), { merge: true });
    }
    for (const task of INITIAL_TASKS) {
      await setDoc(doc(db, 'users', userId, 'tasks', task.id), cleanForFirestore(task), { merge: true });
    }
    for (const tree of INITIAL_PLANTED_TREES) {
      await setDoc(doc(db, 'users', userId, 'plantedTrees', tree.id), cleanForFirestore(tree), { merge: true });
    }
    for (const lecture of INITIAL_COLLEGE_LECTURES) {
      await setDoc(doc(db, 'users', userId, 'lectures', lecture.id), cleanForFirestore(lecture), { merge: true });
    }
  } catch (err) {
    console.warn('Error populating sample data:', err);
  }
}

/**
 * Subscribe to all user data in Firestore with local storage backup
 */
export function subscribeToUserData(
  userId: string,
  onData: (data: Partial<UserDataState>) => void,
  onError?: (error: Error) => void
) {
  // Emit initial local state immediately if available
  const cached = getLocalUserState(userId);
  if (cached) {
    onData(cached);
  }

  const userDocRef = doc(db, 'users', userId);

  // 1. Listen to user document
  const unsubUser = onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        const update: Partial<UserDataState> = {};
        if (d.profile !== undefined) update.profile = d.profile;
        if (d.availability !== undefined) update.availability = d.availability;
        if (d.commute !== undefined) update.commute = d.commute;
        if (d.coins !== undefined) update.coins = d.coins;
        if (d.unlockedSpecies !== undefined) update.unlockedSpecies = d.unlockedSpecies;
        if (d.todayPlan !== undefined) update.todayPlan = d.todayPlan;
        if (d.weeklyPlan !== undefined) update.weeklyPlan = d.weeklyPlan;

        saveLocalUserState(userId, update);
        onData(update);
      }
    },
    (err) => {
      console.warn('User doc listener notification:', err.message);
      if (onError) onError(err);
    }
  );

  // 2. Listen to courses subcollection
  const coursesColl = collection(db, 'users', userId, 'courses');
  const unsubCourses = onSnapshot(
    coursesColl,
    (snapshot) => {
      const courses = snapshot.docs.map((d) => d.data() as Course);
      saveLocalUserState(userId, { courses });
      onData({ courses });
    },
    (err) => {
      console.warn('Courses listener notification:', err.message);
    }
  );

  // 3. Listen to tasks subcollection
  const tasksColl = collection(db, 'users', userId, 'tasks');
  const unsubTasks = onSnapshot(
    tasksColl,
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => d.data() as Task);
      saveLocalUserState(userId, { tasks });
      onData({ tasks });
    },
    (err) => {
      console.warn('Tasks listener notification:', err.message);
    }
  );

  // 4. Listen to planted trees subcollection
  const treesColl = collection(db, 'users', userId, 'plantedTrees');
  const unsubTrees = onSnapshot(
    treesColl,
    (snapshot) => {
      const plantedTrees = snapshot.docs.map((d) => d.data() as PlantedTree);
      plantedTrees.sort((a, b) => new Date(b.plantedAt).getTime() - new Date(a.plantedAt).getTime());
      saveLocalUserState(userId, { plantedTrees });
      onData({ plantedTrees });
    },
    (err) => {
      console.warn('Trees listener notification:', err.message);
    }
  );

  // 5. Listen to college lectures subcollection
  const lecturesColl = collection(db, 'users', userId, 'lectures');
  const unsubLectures = onSnapshot(
    lecturesColl,
    (snapshot) => {
      const lectures = snapshot.docs.map((d) => d.data() as CollegeLecture);
      saveLocalUserState(userId, { lectures });
      onData({ lectures });
    },
    (err) => {
      console.warn('Lectures listener notification:', err.message);
    }
  );

  return () => {
    unsubUser();
    unsubCourses();
    unsubTasks();
    unsubTrees();
    unsubLectures();
  };
}

// User Profile / Settings updates
export async function updateUserProfileDoc(userId: string, data: Partial<UserDataState>): Promise<void> {
  saveLocalUserState(userId, data);
  try {
    const userDocRef = doc(db, 'users', userId);
    const sanitized = cleanForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userDocRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore updateUserProfileDoc error:', err);
  }
}

// Course CRUD
export async function saveCourseToDb(userId: string, course: Course): Promise<void> {
  const current = getLocalUserState(userId)?.courses || [];
  const updated = [...current.filter((c) => c.id !== course.id), course];
  saveLocalUserState(userId, { courses: updated });

  try {
    const courseDoc = doc(db, 'users', userId, 'courses', course.id);
    const sanitized = cleanForFirestore(course);
    await setDoc(courseDoc, sanitized, { merge: true });
  } catch (err) {
    console.error('Firestore saveCourseToDb failed:', err);
  }
}

export async function saveCoursesToDb(userId: string, courses: Course[]): Promise<void> {
  saveLocalUserState(userId, { courses });
  try {
    for (const course of courses) {
      const courseDoc = doc(db, 'users', userId, 'courses', course.id);
      await setDoc(courseDoc, cleanForFirestore(course), { merge: true });
    }
  } catch (err) {
    console.error('Firestore saveCoursesToDb error:', err);
  }
}

export async function deleteCourseFromDb(userId: string, courseId: string): Promise<void> {
  const current = getLocalUserState(userId)?.courses || [];
  const updated = current.filter((c) => c.id !== courseId);
  saveLocalUserState(userId, { courses: updated });

  try {
    const courseDoc = doc(db, 'users', userId, 'courses', courseId);
    await deleteDoc(courseDoc);
  } catch (err) {
    console.warn('Firestore deleteCourseFromDb error:', err);
  }
}

// Task CRUD
export async function saveTaskToDb(userId: string, task: Task): Promise<void> {
  const current = getLocalUserState(userId)?.tasks || [];
  const updated = [...current.filter((t) => t.id !== task.id), task];
  saveLocalUserState(userId, { tasks: updated });

  try {
    const taskDoc = doc(db, 'users', userId, 'tasks', task.id);
    const sanitized = cleanForFirestore(task);
    await setDoc(taskDoc, sanitized, { merge: true });
  } catch (err) {
    console.error('Firestore saveTaskToDb error:', err);
  }
}

export async function deleteTaskFromDb(userId: string, taskId: string): Promise<void> {
  const current = getLocalUserState(userId)?.tasks || [];
  const updated = current.filter((t) => t.id !== taskId);
  saveLocalUserState(userId, { tasks: updated });

  try {
    const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskDoc);
  } catch (err) {
    console.warn('Firestore deleteTaskFromDb error:', err);
  }
}

// Planted Tree CRUD
export async function savePlantedTreeToDb(userId: string, tree: PlantedTree): Promise<void> {
  const current = getLocalUserState(userId)?.plantedTrees || [];
  const updated = [tree, ...current.filter((t) => t.id !== tree.id)];
  saveLocalUserState(userId, { plantedTrees: updated });

  try {
    const treeDoc = doc(db, 'users', userId, 'plantedTrees', tree.id);
    await setDoc(treeDoc, cleanForFirestore(tree), { merge: true });
  } catch (err) {
    console.warn('Firestore savePlantedTreeToDb error:', err);
  }
}

// College Lectures CRUD
export async function saveLecturesToDb(userId: string, lectures: CollegeLecture[]): Promise<void> {
  saveLocalUserState(userId, { lectures });
  try {
    const lecturesColl = collection(db, 'users', userId, 'lectures');
    const existingSnaps = await getDocs(lecturesColl);
    const newIds = new Set(lectures.map((l) => l.id));
    for (const d of existingSnaps.docs) {
      if (!newIds.has(d.id)) {
        await deleteDoc(d.ref);
      }
    }
    for (const lecture of lectures) {
      const lectureDoc = doc(db, 'users', userId, 'lectures', lecture.id);
      await setDoc(lectureDoc, cleanForFirestore(lecture), { merge: true });
    }
  } catch (err) {
    console.warn('Firestore saveLecturesToDb error:', err);
  }
}

export async function deleteLectureFromDb(userId: string, lectureId: string): Promise<void> {
  const current = getLocalUserState(userId)?.lectures || [];
  const updated = current.filter((l) => l.id !== lectureId);
  saveLocalUserState(userId, { lectures: updated });

  try {
    const lectureDoc = doc(db, 'users', userId, 'lectures', lectureId);
    await deleteDoc(lectureDoc);
  } catch (err) {
    console.warn('Firestore deleteLectureFromDb error:', err);
  }
}

/**
 * Save Scanned Timetable Data (Lectures, Courses, Tasks, Availability, Plans) in batch
 */
export async function saveBatchScannedWorkspaceData(
  userId: string,
  data: {
    courses: Course[];
    tasks: Task[];
    lectures: CollegeLecture[];
    todayPlan: TodayPlanItem[];
    weeklyPlan: PlannedSession[];
    availability: StudyAvailability;
  }
): Promise<void> {
  const current = getLocalUserState(userId) || {};
  const existingCourses = current.courses || [];
  const mergedCourses = [...existingCourses];
  for (const c of data.courses) {
    if (!mergedCourses.some((existing) => existing.id === c.id || existing.name.toLowerCase() === c.name.toLowerCase())) {
      mergedCourses.push(c);
    }
  }

  const mergedTasks = [...(current.tasks || []), ...data.tasks];

  saveLocalUserState(userId, {
    courses: mergedCourses,
    tasks: mergedTasks,
    lectures: data.lectures,
    todayPlan: data.todayPlan,
    weeklyPlan: data.weeklyPlan,
    availability: data.availability,
  });

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, cleanForFirestore({
      todayPlan: data.todayPlan,
      weeklyPlan: data.weeklyPlan,
      availability: data.availability,
      updatedAt: new Date().toISOString(),
    }), { merge: true });

    for (const course of data.courses) {
      await setDoc(doc(db, 'users', userId, 'courses', course.id), cleanForFirestore(course), { merge: true });
    }
    for (const task of data.tasks) {
      await setDoc(doc(db, 'users', userId, 'tasks', task.id), cleanForFirestore(task), { merge: true });
    }
    for (const lecture of data.lectures) {
      await setDoc(doc(db, 'users', userId, 'lectures', lecture.id), cleanForFirestore(lecture), { merge: true });
    }
  } catch (err) {
    console.warn('Firestore saveBatchScannedWorkspaceData error:', err);
  }
}

