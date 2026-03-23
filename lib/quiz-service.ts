import { doc, getDoc, getDocs, query, where, limit, setDoc, updateDoc, collection, Timestamp, increment } from "firebase/firestore";
import { db } from "./firebase/config";
import { Lecture, Mistake } from "@/types";

/**
 * Fetches the lecture document which contains the embedded questions.
 * @param lectureId The ID of the lecture to fetch.
 */
export async function fetchQuiz(lectureId: string) {
  try {
    const lectureRef = doc(db, "lectures", lectureId);
    const lectureSnap = await getDoc(lectureRef);

    if (lectureSnap.exists()) {
      return { id: lectureSnap.id, ...lectureSnap.data() } as Lecture;
    }
    return null;
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw error;
  }
}

/**
 * Saves a question as a mistake for the user.
 * Increments the count if the mistake already exists.
 * @param userId ID of the current user.
 * @param lectureId ID of the lecture.
 * @param subjectId ID of the subject (from lecture).
 * @param questionId ID of the specific question.
 */
export async function saveMistake(
  userId: string,
  lectureId: string,
  subjectId: string,
  questionId: string,
  wrongAnswerIndex: number
) {
  try {
    const mistakesCol = collection(db, "mistakes");
    // Find if this mistake already exists for this user/question
    const q = query(
      mistakesCol,
      where("userId", "==", userId),
      where("questionId", "==", questionId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing mistake
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "mistakes", existingDoc.id), {
        count: increment(1),
        lastSeenAt: Timestamp.now(),
        isReviewed: false,
        wrongAnswerIndex: wrongAnswerIndex, // Keep track of the latest wrong choice
      });
      return existingDoc.id;
    } else {
      // Create new mistake
      const newMistakeRef = doc(mistakesCol);
      const newMistake: Omit<Mistake, "id"> = {
        userId,
        lectureId,
        subjectId,
        questionId,
        count: 1,
        isReviewed: false,
        lastSeenAt: Timestamp.now(),
        wrongAnswerIndex: wrongAnswerIndex,
      };
      await setDoc(newMistakeRef, newMistake);
      return newMistakeRef.id;
    }
  } catch (error) {
    console.error("Error saving mistake:", error);
    throw error;
  }
}
