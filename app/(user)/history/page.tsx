"use client";

import { useState, useEffect } from "react";
import { getUserSessions } from "@/lib/weekplan-service";
import { useAuthStore } from "@/store/authStore";
import { StudySession } from "@/types";
import { comfortaa } from "@/lib/fonts";
import AncientChronicleBook from "@/components/history/AncientChronicleBook";
import { Trophy, Clock, ScrollText } from "lucide-react";

// Removed consolidateSessions - user wants individual entries per session.

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const sessionsData = await getUserSessions(user.id);
        setSessions(sessionsData);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalXP = Math.floor(totalMinutes / 10);

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
            <Clock className="text-tomato" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Focus Hours</p>
              <p className="text-xl font-black text-tomato">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
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
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <ScrollText size={48} className="mx-auto text-[#EDE8DC]" />
            <p className="text-muted-foreground font-bold">Your chronicle pages are empty. <br/>A new legend begins with your first focus.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-hidden md:overflow-x-visible">
            <AncientChronicleBook sessions={sessions} />
          </div>
        )}
      </div>
    </div>
  );
}
