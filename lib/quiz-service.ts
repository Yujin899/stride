import { doc, getDoc, getDocs, query, where, limit, setDoc, updateDoc, collection, Timestamp, increment, addDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import { Lecture, Mistake, QuizAttempt, QuizAnswer } from "@/types";
import { quizAttemptsCol } from "./firebase/collections";

/**
 * Calculates XP based on the streak rule:
 * - 10 XP per correct answer.
 * - After a 5-question streak (within the quiz), XP is doubled (20 XP) for subsequent correct answers.
 * - Streak resets on incorrect answer.
 */
function calculateXP(answers: QuizAnswer[]): number {
  let totalXp = 0;
  let currentStreak = 0;
  const BASE_XP = 10;
  const STREAK_THRESHOLD = 5;

  answers.forEach((ans) => {
    if (ans.isCorrect) {
      currentStreak++;
      if (currentStreak > STREAK_THRESHOLD) {
        totalXp += BASE_XP * 2;
      } else {
        totalXp += BASE_XP;
      }
    } else {
      currentStreak = 0;
    }
  });

  return totalXp;
}

/**
 * Saves a completed quiz attempt to Firestore.
 */
export async function saveQuizAttempt(
  userId: string,
  lectureId: string,
  subjectId: string,
  quizTitle: string,
  answers: QuizAnswer[],
  score: number
) {
  try {
    const xpEarned = calculateXP(answers);
    
    const attemptData: Omit<QuizAttempt, "id"> = {
      userId,
      lectureId,
      subjectId,
      quizTitle,
      answers,
      score,
      xpEarned,
      completedAt: Timestamp.now()
    };

    const docRef = await addDoc(quizAttemptsCol, attemptData);
    
    // Also update the user's overall streak if applicable (Simplified: Increment if they studied today)
    // In a real app, you'd check if they already studied today.
    // For now, we prioritize saving the attempt and XP.
    
    return { id: docRef.id, xpEarned };
  } catch (error) {
    console.error("Error saving quiz attempt:", error);
    throw error;
  }
}

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
