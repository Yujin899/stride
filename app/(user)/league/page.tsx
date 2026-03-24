"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, LeaderboardEntry } from "@/lib/user-service";
import { Comfortaa, Nunito } from "next/font/google";
import { Loader2, Trophy, Medal, Target, Zap, Waves } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export default function LeaguePage() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const data = await getLeaderboard();
      setLeaderboard(data);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic animate-pulse">Consulting the Scribes...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-12 pb-20 ${nunito.className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
          <Trophy size={14} /> Global Rankings
        </div>
        <h1 className={`${comfortaa.className} text-4xl sm:text-5xl text-foreground font-bold leading-tight`}>
          Stride League 🏆
        </h1>
        <p className="max-w-md mx-auto text-sm text-muted-foreground font-medium">
          Compete with fellow scholars to reach the top of the realm. Honor is earned through consistency and mastery.
        </p>
      </div>

      {/* Leaderboard Grid */}
      <div className="wooden-panel p-0! overflow-hidden shadow-warm border-2 border-border/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-active/30 border-b border-border/10">
                <th className="px-3 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-12 sm:w-20 text-center">Rank</th>
                <th className="px-3 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Scholar</th>
                <th className="px-3 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">XP</th>
                <th className="px-3 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center hidden xs:table-cell">Accuracy</th>
                <th className="px-3 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.userId === user?.id;
                const rank = index + 1;

                return (
                  <tr 
                    key={entry.userId} 
                    className={`group transition-all hover:bg-primary/5 ${isCurrentUser ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}
                  >
                    <td className="px-3 sm:px-6 py-5">
                      <div className="flex items-center justify-center">
                        {rank === 1 ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white shadow-md animate-bounce">
                             <Trophy size={14} className="sm:size-[16px]" />
                          </div>
                        ) : rank === 2 ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-300 flex items-center justify-center text-white shadow-sm">
                             <Medal size={14} className="sm:size-[16px]" />
                          </div>
                        ) : rank === 3 ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-400 flex items-center justify-center text-white shadow-sm">
                             <Medal size={14} className="sm:size-[16px]" />
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm font-black text-muted-foreground/40">{rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface border-2 border-border/10 overflow-hidden flex-shrink-0">
                          <Image src="/tomato.png" alt="Avatar" fill className="object-cover p-1" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                            {entry.name} {isCurrentUser && <span className="hidden sm:inline">(You)</span>}
                          </p>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                            {entry.totalSessions} sessions
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-5">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-orange-500 font-black text-xs sm:text-sm">
                          <Zap size={12} className="sm:size-[14px]" fill="currentColor" />
                          {entry.totalXp}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-5 hidden xs:table-cell">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-secondary font-black text-xs sm:text-sm">
                          <Target size={12} className="sm:size-[14px]" />
                          {entry.avgScore}%
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-5 text-right">
                      <div className="inline-flex items-center gap-1 bg-tomato/10 text-tomato px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black">
                        {entry.streak} 🍅
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="wooden-panel p-6! bg-surface-active/30 text-center">
         <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-3">
           <Waves size={14} className="animate-pulse" />
           The league resets every Monday at Midnight
           <Waves size={14} className="animate-pulse" />
         </p>
      </div>
    </div>
  );
}
