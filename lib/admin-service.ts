import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion
} from "firebase/firestore";
import { db } from "./firebase/config";
import { Subject, Lecture, Question } from "@/types";

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
  questions: Question[], 
  lectureTitle: string,
  quizTitle: string = "Standard Quiz"
): Promise<string> {
  try {
    // Check if a lecture with this order already exists for the subject
    const q = query(
      collection(db, "lectures"), 
      where("subjectId", "==", subjectId),
      where("order", "==", order)
    );
    const snap = await getDocs(q);
    
    const newQuiz = {
      id: crypto.randomUUID(),
      title: quizTitle,
      questions,
      createdAt: Timestamp.now()
    };

    if (!snap.empty) {
      // Append to existing lecture using arrayUnion to be safe and efficient
      const docId = snap.docs[0].id;
      await updateDoc(doc(db, "lectures", docId), {
        quizzes: arrayUnion(newQuiz)
      });
      return docId;
    } else {
      // Create new lecture
      const newLecture: Partial<Lecture> = {
        subjectId,
        order,
        isLocked,
        title: lectureTitle,
        quizzes: [newQuiz],
        createdAt: Timestamp.now(), // Changed to now() for consistency in array-containing docs
      };
      
      const docRef = await addDoc(collection(db, "lectures"), newLecture);
      return docRef.id;
    }
  } catch (err) {
    console.error("Error uploading lecture:", err);
    throw err;
  }
}

/**
 * Update existing subject details
 */
export async function updateSubject(id: string, data: Partial<Subject>): Promise<void> {
  try {
    const docRef = doc(db, "subjects", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error updating subject:", err);
    throw err;
  }
}

/**
 * Delete a subject and all its associated lectures
 */
export async function deleteSubject(id: string): Promise<void> {
  try {
    // 1. Delete all lectures for this subject
    const q = query(collection(db, "lectures"), where("subjectId", "==", id));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(lDoc => deleteDoc(doc(db, "lectures", lDoc.id)));
    await Promise.all(deletePromises);

    // 2. Delete the subject itself
    await deleteDoc(doc(db, "subjects", id));
  } catch (err) {
    console.error("Error deleting subject:", err);
    throw err;
  }
}

/**
 * Fetch all lectures for a specific subject
 */
export async function fetchLecturesBySubject(subjectId: string): Promise<Lecture[]> {
  try {
    const q = query(
      collection(db, "lectures"), 
      where("subjectId", "==", subjectId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Lecture))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error("Error fetching lectures:", err);
    return [];
  }
}

/**
 * Delete a specific lecture
 */
export async function deleteLecture(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "lectures", id));
  } catch (err) {
    console.error("Error deleting lecture:", err);
    throw err;
  }
}

/**
 * Update a specific lecture (e.g. title, lock status, or questions)
 */
export async function updateLecture(id: string, data: Partial<Lecture>): Promise<void> {
  try {
    const docRef = doc(db, "lectures", id);
    await updateDoc(docRef, data);
  } catch (err) {
    console.error("Error updating lecture:", err);
    throw err;
  }
}
