import { 
  collection, 
  FirestoreDataConverter, 
  DocumentData, 
  QueryDocumentSnapshot, 
  SnapshotOptions,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";
import { 
  User, 
  Subject, 
  Lecture, 
  WeekPlan, 
  QuizAttempt, 
  Mistake,
  StudySession
} from "../../types";

/**
 * Generic converter to map Firestore data to TypeScript interfaces
 * including the document ID.
 */
const genericConverter = <T extends { id: string }>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = data as unknown as (Omit<T, 'id'> & { id: string });
    return rest as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
    } as T;
  },
});

/**
 * Helper to convert Firebase Timestamp to JS Date for UI components
 */
export const toDate = (timestamp: unknown): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  
  const ts = timestamp as { seconds: number; nanoseconds: number };
  if (ts.seconds !== undefined) {
    return new Timestamp(ts.seconds, ts.nanoseconds).toDate();
  }
  
  const date = new Date(timestamp as string | number);
  return isNaN(date.getTime()) ? null : date;
};

// Typed Collection References
export const usersCol = collection(db, "users").withConverter(genericConverter<User>());
export const subjectsCol = collection(db, "subjects").withConverter(genericConverter<Subject>());
export const lecturesCol = collection(db, "lectures").withConverter(genericConverter<Lecture>());
export const weekPlansCol = collection(db, "weekPlan").withConverter(genericConverter<WeekPlan>());
export const quizAttemptsCol = collection(db, "quizAttempts").withConverter(genericConverter<QuizAttempt>());
export const mistakesCol = collection(db, "mistakes").withConverter(genericConverter<Mistake>());
export const sessionsCol = collection(db, "sessions").withConverter(genericConverter<StudySession>());
