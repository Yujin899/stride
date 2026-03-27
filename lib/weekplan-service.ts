import { 
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Subject, Lecture, StudySession } from "@/types";
import { subjectsCol, lecturesCol, sessionsCol, toDate } from "./firebase/collections";

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
