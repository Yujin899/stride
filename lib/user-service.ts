import { getDocs } from "firebase/firestore";
import { User, StudySession, QuizAttempt } from "@/types";
import { usersCol, sessionsCol, quizAttemptsCol } from "./firebase/collections";

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

    // 2. Fetch all sessions and quiz attempts (simplified for now)
    const [sessionsSnap, quizSnap] = await Promise.all([
      getDocs(sessionsCol),
      getDocs(quizAttemptsCol)
    ]);

    const sessions = sessionsSnap.docs.map(doc => doc.data() as StudySession);
    const quizzes = quizSnap.docs.map(doc => doc.data() as QuizAttempt);

    // 3. Aggregate data per user
    const leaderboard: LeaderboardEntry[] = users.map(user => {
      const userSessions = sessions.filter(s => s.userId === user.id);
      const userQuizzes = quizzes.filter(q => q.userId === user.id);

      const totalXp = userSessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
      const avgScore = userQuizzes.length > 0 
        ? Math.round(userQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / userQuizzes.length)
        : 0;

      return {
        userId: user.id,
        name: user.name || "Anonymous Scholar",
        totalXp,
        avgScore,
        streak: user.streak || 0,
        totalSessions: userSessions.length
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
