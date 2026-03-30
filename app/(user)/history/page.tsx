"use client";

import { useState, useEffect } from "react";
import { getUserQuizAttempts } from "@/lib/quiz-service";
import { useAuthStore } from "@/store/authStore";
import { QuizAttempt } from "@/types";
import { comfortaa } from "@/lib/fonts";
import AncientChronicleBook from "@/components/history/AncientChronicleBook";
import { Trophy, BookOpen, ScrollText } from "lucide-react";

// The History Book now chronicles quiz accomplishments rather than focus timer sessions.

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const quizData = await getUserQuizAttempts(user.id);
        setAttempts(quizData);
      } catch (error) {
        console.error("Error fetching quiz history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const totalXP = attempts.reduce((acc, q) => acc + (q.xpEarned || 0), 0);
  const totalQuizzes = attempts.length;

  if (!user) return (
    <div className="py-20 text-center text-muted-foreground font-bold italic">
      Waiting for the sacred scholar...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header with Stats */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <h1 className={`${comfortaa.className} text-4xl font-black text-foreground`}>
            Your Chronicle 📜
          </h1>
          <p className="text-muted-foreground font-medium">The growing legend of {user.name}.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="wooden-panel px-6 py-3 flex items-center gap-3 rounded-2xl border border-[rgba(212,184,122,0.2)]">
            <Trophy className="text-primary" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scholar XP</p>
              <p className="text-xl font-black text-primary">{totalXP}</p>
            </div>
          </div>
          <div className="wooden-panel px-6 py-3 flex items-center gap-3 rounded-2xl border border-[rgba(212,184,122,0.2)]">
            <BookOpen className="text-tomato" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scholarly Quests</p>
              <p className="text-xl font-black text-tomato">{totalQuizzes}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Immersive History View */}
      <div className="relative">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground font-bold italic animate-pulse">
            Consulting your personal tomes...
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <ScrollText size={48} className="mx-auto text-[#EDE8DC]" />
            <p className="text-muted-foreground font-bold">Your chronicle pages are empty. <br/>A new legend begins with your first scholarly quest.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-hidden md:overflow-x-visible">
            <AncientChronicleBook attempts={attempts} />
          </div>
        )}
      </div>
    </div>
  );
}
