import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { startOfWeek, addDays, getISOWeek, getYear } from "date-fns";
import { WeekPlan, Subject, DayPlan, Lecture, StudySession } from "@/types";
import { weekPlansCol, subjectsCol, lecturesCol, sessionsCol, toDate } from "./firebase/collections";

/**
 * Saves a completed study session to history
 */
export const saveStudySession = async (session: Omit<StudySession, "id" | "completedAt">): Promise<string> => {
  const docRef = await addDoc(sessionsCol, {
    ...session,
    completedAt: serverTimestamp()
  } as Omit<StudySession, "id">);
  return docRef.id;
};

/**
 * Fetches study history for a user
 */
export const getUserSessions = async (userId: string): Promise<StudySession[]> => {
  const q = query(sessionsCol, where("userId", "==", userId));
  const snap = await getDocs(q);
  const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as StudySession));
  
  return data.sort((a, b) => {
    const dateA = toDate(a.completedAt)?.getTime() || 0;
    const dateB = toDate(b.completedAt)?.getTime() || 0;
    return dateB - dateA;
  });
};

/**
 * Fetches all study history for all users
 */
export const getAllSessions = async (): Promise<StudySession[]> => {
  const snap = await getDocs(sessionsCol);
  const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as StudySession));
  
  return data.sort((a, b) => {
    const dateA = toDate(a.completedAt)?.getTime() || 0;
    const dateB = toDate(b.completedAt)?.getTime() || 0;
    return dateB - dateA;
  });
};

/**
 * Generates the standardized week ID: userId_week_year
 */
export const getWeekId = (userId: string, date: Date) => {
  const weekNum = getISOWeek(date);
  const year = getYear(date);
  return `${userId}_${weekNum}_${year}`;
};

/**
 * Fetches or creates a week plan document
 */
export const getOrCreateWeekPlan = async (userId: string, date: Date): Promise<WeekPlan> => {
  const weekId = getWeekId(userId, date);
  const docRef = doc(weekPlansCol, weekId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as WeekPlan;
  }

  // Create new empty week plan
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const newPlan: Partial<WeekPlan> = {
    userId,
    weekNumber: getISOWeek(date),
    year: getYear(date),
    startDate: start,
    days: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }
  };

  await setDoc(docRef, newPlan);
  return { id: weekId, ...newPlan } as WeekPlan;
};

/**
 * Updates a specific day's plan array
 */
export const updateDayPlansArr = async (
  userId: string, 
  date: Date, 
  dayName: string, 
  plansArr: DayPlan[]
) => {
  const weekId = getWeekId(userId, date);
  const docRef = doc(weekPlansCol, weekId);
  
  await updateDoc(docRef, {
    [`days.${dayName.toLowerCase()}`]: plansArr
  });
};

/**
 * Fetches real lectures for a given subject
 */
export const getLecturesBySubject = async (subjectId: string): Promise<Lecture[]> => {
  // Use in-memory sort to avoid needing a composite index
  const q = query(lecturesCol, where("subjectId", "==", subjectId));
  const snap = await getDocs(q);
  return snap.docs
    .map(doc => doc.data() as Lecture)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * Fetches all available subjects
 */
export const getSubjects = async (): Promise<Subject[]> => {
  const q = query(subjectsCol, orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as Subject);
};

/**
 * Gets the list of dates for a given week starting from a date
 */
export const getWeekDates = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
};

/**
 * Marks a quest as complete if it exists in the current week's plan
 */
export const completeQuest = async (userId: string, lectureId: string, score: number) => {
  const now = new Date();
  const weekId = getWeekId(userId, now);
  const docRef = doc(weekPlansCol, weekId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  const data = docSnap.data() as WeekPlan;
  const days = data.days as Record<string, DayPlan[]>;
  let found = false;

  // Search through each day to find the matching lectureId
  for (const day of Object.keys(days)) {
    const plans = days[day];
    const planIndex = plans.findIndex(p => p.lectureId === lectureId && p.status !== "done");

    if (planIndex !== -1) {
      plans[planIndex].status = "done";
      plans[planIndex].score = score;
      plans[planIndex].completedAt = Timestamp.now();
      found = true;
      break; 
    }
  }

  if (found) {
    await updateDoc(docRef, { days });
  }
};
