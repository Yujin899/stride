import { getDocs } from "firebase/firestore";
import { User, QuizAttempt } from "@/types";
import { usersCol, quizAttemptsCol } from "./firebase/collections";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  totalXp: number;
  avgScore: number;
  streak: number;
  totalSessions: number;
}

/**
 * Aggregates stats for all users to generate a ranked leaderboard
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // 1. Fetch all users
    const userSnap = await getDocs(usersCol);
    const users = userSnap.docs.map(doc => doc.data() as User);

    // 2. Fetch all quiz attempts (simplified for now)
    const quizSnap = await getDocs(quizAttemptsCol);
    const quizzes = quizSnap.docs.map(doc => doc.data() as QuizAttempt);

    // 3. Aggregate data per user
    const leaderboard: LeaderboardEntry[] = users.map(user => {
      const allUserQuizzes = quizzes.filter(q => q.userId === user.id);
      
      // Filter unique quizzes: Take the best attempt for each unique quiz (lectureId + title)
      // This prevents stats inflation from duplicate submissions or repeated attempts.
      const uniqueBestQuizzes = Array.from(
        allUserQuizzes.reduce((map, q) => {
          const key = `${q.lectureId}-${q.quizTitle}`;
          const currentBest = map.get(key);
          if (!currentBest || (q.xpEarned || 0) > (currentBest.xpEarned || 0)) {
            map.set(key, q);
          }
          return map;
        }, new Map<string, QuizAttempt>()).values()
      );

      const totalXp = uniqueBestQuizzes.reduce((sum, q) => {
        const xp = q.xpEarned !== undefined ? q.xpEarned : (q.score || 0);
        return sum + xp;
      }, 0);
      
      const avgScore = uniqueBestQuizzes.length > 0 
        ? Math.round(uniqueBestQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / uniqueBestQuizzes.length)
        : 0;

      return {
        userId: user.id,
        name: user.name || "Anonymous Scholar",
        totalXp,
        avgScore,
        streak: user.streak || 0,
        totalSessions: uniqueBestQuizzes.length 
      };
    });

    // 4. Sort by XP desc, then Score desc
    return leaderboard.sort((a, b) => {
      if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
      return b.avgScore - a.avgScore;
    });
  } catch (err) {
    console.error("Error generating leaderboard:", err);
    return [];
  }
}
