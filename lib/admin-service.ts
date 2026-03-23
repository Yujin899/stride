import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase/config";
import { Subject, Lecture } from "@/types";

/**
 * Fetch all available subjects for selection
 */
export async function fetchAllSubjects(): Promise<Subject[]> {
  try {
    const q = query(collection(db, "subjects"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
  } catch (err) {
    console.error("Error fetching subjects:", err);
    throw err;
  }
}

/**
 * Add a new subject to the curriculum
 */
export async function createSubject(name: string): Promise<Subject> {
  try {
    // Get highest order to append
    const q = query(collection(db, "subjects"), orderBy("order", "desc"), limit(1));
    const snap = await getDocs(q);
    const lastOrder = snap.empty ? 0 : (snap.docs[0].data() as Subject).order;

    const newSubject: Partial<Subject> = {
      name,
      color: "#8B6914", // Default primary color, user can change later
      order: lastOrder + 1,
      createdAt: serverTimestamp() as unknown as Timestamp
    };

    const docRef = await addDoc(collection(db, "subjects"), newSubject);
    return { id: docRef.id, ...newSubject } as Subject;
  } catch (err) {
    console.error("Error creating subject:", err);
    throw err;
  }
}

/**
 * Determine the next lecture number for a specific subject
 */
export async function getNextLectureOrder(subjectId: string): Promise<number> {
  try {
    // Simple query without orderBy on different fields to avoid composite index requirement
    const q = query(
      collection(db, "lectures"), 
      where("subjectId", "==", subjectId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return 1;
    
    // Find highest order in memory
    const lastOrder = Math.max(...snap.docs.map(doc => (doc.data() as Lecture).order || 0));
    return lastOrder + 1;
  } catch (err) {
    console.error("Error getting lecture order:", err);
    return 1;
  }
}

/**
 * Save a final lecture with questions to Firestore
 */
export async function uploadLecture(
  subjectId: string, 
  order: number, 
  isLocked: boolean, 
  questions: any[], 
  title: string
): Promise<string> {
  try {
    const newLecture: Partial<Lecture> = {
      subjectId,
      order,
      isLocked,
      questions,
      createdAt: serverTimestamp() as unknown as Timestamp,
    };
    
    // Using typed save. (Title is added ad-hoc as per requirement)
    const docRef = await addDoc(collection(db, "lectures"), {
      ...newLecture,
      title
    });
    
    return docRef.id;
  } catch (err) {
    console.error("Error uploading lecture:", err);
    throw err;
  }
}
