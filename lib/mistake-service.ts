import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase/config";
import { Mistake, Lecture, Question } from "@/types";

export interface MistakeWithContent extends Mistake {
  question?: Question;
  lectureNumber?: number;
}

/**
 * Fetch all unreviewed mistakes for a user, joined with question data
 */
export async function getUserMistakes(userId: string): Promise<MistakeWithContent[]> {
  try {
    const mistakesRef = collection(db, "mistakes");
    const q = query(
      mistakesRef, 
      where("userId", "==", userId),
      where("isReviewed", "==", false)
    );
    
    const snap = await getDocs(q);
    const mistakes = snap.docs.map(d => ({ id: d.id, ...d.data() } as Mistake));

    // Sort in memory to avoid needing a composite index
    mistakes.sort((a, b) => {
      const timeA = a.lastSeenAt?.toMillis?.() || 0;
      const timeB = b.lastSeenAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    // Joint data: we need lectures to get the actual question text
    // Optimization: collect unique lectureIds to fetch all needed lectures at once
    const lectureIds = Array.from(new Set(mistakes.map(m => m.lectureId)));
    const lecturesMap: Record<string, Lecture> = {};
    
    await Promise.all(
      lectureIds.map(async (lid) => {
        const lSnap = await getDoc(doc(db, "lectures", lid));
        if (lSnap.exists()) {
          lecturesMap[lid] = { id: lid, ...lSnap.data() } as Lecture;
        }
      })
    );
    
    // Map mistakes to their content
    const combined: MistakeWithContent[] = mistakes.map(m => {
      const lecture = lecturesMap[m.lectureId];
      const question = lecture?.questions.find(q => q.id === m.questionId);
      return {
        ...m,
        question,
        lectureNumber: lecture?.order
      };
    }).filter(m => !!m.question); // Only return if question data exists
    
    return combined;
  } catch (err) {
    console.error("Error fetching mistakes:", err);
    throw err;
  }
}

/**
 * Mark a mistake as reviewed
 */
export async function markMistakeAsReviewed(mistakeId: string): Promise<void> {
  try {
    const ref = doc(db, "mistakes", mistakeId);
    await updateDoc(ref, {
      isReviewed: true
    });
  } catch (err) {
    console.error("Error marking mistake reviewed:", err);
    throw err;
  }
}
