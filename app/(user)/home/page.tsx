"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { QuizAttempt } from "@/types";
import { Timestamp, query, where, getDocs } from "firebase/firestore";
import FocusBlooms from "@/components/home/FocusBlooms";
import { quizAttemptsCol } from "@/lib/firebase/collections";
import { getLeaderboard, LeaderboardEntry } from "@/lib/user-service";
import { 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  History as HistoryIcon, 
  LayoutDashboard, 
  Trophy,
  Medal,
  Target,
  Zap,
  Waves,
  Timer
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { comfortaa, nunito } from "@/lib/fonts";

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State
  const [todayQuizzes, setTodayQuizzes] = useState<QuizAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const q = query(quizAttemptsCol, where("userId", "==", user.id));
        const [quizSnap, leaderboardData] = await Promise.all([
          getDocs(q),
          getLeaderboard()
        ]);
        
        const allUserQuizzes = quizSnap.docs.map(doc => doc.data() as QuizAttempt);

        // Filter for today
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const filteredQuizzes = allUserQuizzes.filter(q => {
          if (!q.completedAt) return false;
          const d = (q.completedAt as Timestamp).toDate ? (q.completedAt as Timestamp).toDate() : (q.completedAt as unknown as Date);
          return format(d, "yyyy-MM-dd") === todayStr;
        });

        setTodayQuizzes(filteredQuizzes);
        setLeaderboard(leaderboardData);
      } catch (err: unknown) {
        console.error("HomePage initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-display font-bold">Syncing chronometer...</p>
      </div>
    );
  }

  return (
    <div className={`relative space-y-12 pb-24 animate-in fade-in duration-1000 ${nunito.className}`}>
      {/* Visual Identity Layer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-linear-to-b from-primary/5 to-transparent -z-10 rounded-full blur-3xl" />

      {/* Header & Stats (Tomato Counter) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Howdy, Scholar! 🌿
          </h1>
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
        </div>

        {/* Today's Focus Blooms (Session Tracker) */}
        <FocusBlooms quizzes={todayQuizzes} />
      </div>

      {/* Quick Exploration */}
      <div className="space-y-4 px-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Quick Exploration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push("/study")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-primary/5!"
          >
            <div>
              <h4 className="font-black text-primary group-hover:underline uppercase tracking-tighter text-sm">Study Library</h4>
              <p className="text-[10px] font-bold text-muted-foreground">Continue learning</p>
            </div>
            <ChevronRight size={18} className="text-primary/40 group-hover:text-primary transition-colors" />
          </button>

          <button 
            onClick={() => router.push("/pomodoro")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-secondary/5!"
          >
            <div>
              <h4 className="font-black text-secondary group-hover:underline uppercase tracking-tighter text-sm">Focus Timer</h4>
              <p className="text-[10px] font-bold text-muted-foreground">Start a session</p>
            </div>
            <Timer size={18} className="text-secondary/40 group-hover:text-secondary transition-colors" />
          </button>

          <button 
            onClick={() => router.push("/mistakes")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-tomato/5!"
          >
            <div>
              <h4 className="font-black text-tomato group-hover:underline uppercase tracking-tighter text-sm">Mistakes (Oops!)</h4>
              <p className="text-[10px] font-bold text-muted-foreground">Review and master</p>
            </div>
            <AlertCircle size={18} className="text-tomato/40 group-hover:text-tomato transition-colors" />
          </button>

          <button 
            onClick={() => router.push("/history")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-[#EDE8DC]!"
          >
            <div>
              <h4 className="font-black text-(--text) group-hover:underline uppercase tracking-tighter text-sm">Scholar&apos;s Archive</h4>
              <p className="text-[10px] font-bold text-muted-foreground">Your history</p>
            </div>
            <HistoryIcon size={18} className="text-(--text)/40 group-hover:text-(--text) transition-colors" />
          </button>

          {user?.role === "admin" && (
            <button 
              onClick={() => router.push("/admin")}
              className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-blue-500/5!"
            >
              <div>
                <h4 className="font-black text-blue-600 group-hover:underline uppercase tracking-tighter text-sm">Admin Portal</h4>
                <p className="text-[10px] font-bold text-muted-foreground">Manage content</p>
              </div>
              <LayoutDashboard size={18} className="text-blue-500/40 group-hover:text-blue-600 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Stride League Standings */}
      <section className="space-y-6 px-2 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
             <h3 className="text-2xl font-black text-foreground tracking-tight">Stride League 🏆</h3>
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Scholarly Rankings</p>
           </div>
        </div>

        <div className="wooden-panel p-0! overflow-hidden border-2 border-border/10 shadow-warm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-active/30 border-b border-border/10">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center w-16">Rank</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Scholar</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">XP</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {leaderboard.slice(0, 5).map((entry, index) => {
                  const isCurrentUser = entry.userId === user?.id;
                  const rank = index + 1;

                  return (
                   <tr 
                     key={entry.userId} 
                     className={`group transition-all hover:bg-primary/5 ${isCurrentUser ? "bg-primary/5" : ""}`}
                   >
                     <td className="px-4 py-4">
                       <div className="flex items-center justify-center">
                         {rank === 1 ? (
                           <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-white shadow-sm">
                              <Trophy size={12} />
                           </div>
                         ) : rank === 2 ? (
                           <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-white shadow-sm">
                              <Medal size={12} />
                           </div>
                         ) : rank === 3 ? (
                           <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white shadow-sm">
                              <Medal size={12} />
                           </div>
                         ) : (
                           <span className="text-xs font-black text-muted-foreground/40">{rank}</span>
                         )}
                       </div>
                     </td>
                     <td className="px-4 py-4">
                       <div className="flex items-center gap-3">
                         <div className="relative w-8 h-8 rounded-full bg-surface border-2 border-border/10 overflow-hidden flex-shrink-0">
                           <Image src="/tomato.png" alt="Avatar" fill className="object-cover p-1" />
                         </div>
                         <p className={`text-sm font-bold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                           {entry.name}
                         </p>
                       </div>
                     </td>
                     <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1 text-orange-500 font-black text-sm">
                          <Zap size={12} fill="currentColor" />
                          {entry.totalXp}
                        </div>
                     </td>
                     <td className="px-4 py-4 text-right">
                       <span className="text-[10px] font-black text-tomato bg-tomato/10 px-2 py-1 rounded-full uppercase">
                         {entry.streak} 🍅
                       </span>
                     </td>
                   </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {leaderboard.length > 5 && (
            <div className="p-4 bg-surface-active/10 border-t border-border/5 text-center">
               <p className="text-[10px] font-bold text-muted-foreground italic tracking-widest uppercase">
                 And {leaderboard.length - 5} more competing in the arena...
               </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Insight */}
      <div className="px-2 pt-8">
        <div className="wooden-panel p-6! bg-surface-active/30 text-center border-border/5">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-3">
             <Waves size={14} className="animate-pulse" />
             Stride League: Resets Monday at Midnight
             <Waves size={14} className="animate-pulse" />
           </p>
        </div>
      </div>
    </div>
  );
}

