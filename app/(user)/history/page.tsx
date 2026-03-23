"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { getUserSessions } from "@/lib/weekplan-service";
import { StudySession } from "@/types";
import { format } from "date-fns";
import { ScrollText, Trophy, Clock } from "lucide-react";
import { Comfortaa, Caveat } from "next/font/google";
import { toDate } from "@/lib/firebase/collections";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const handwriting = Caveat({ subsets: ["latin"], weight: ["400", "700"] });

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getUserSessions(user.id).then((data) => {
        setSessions(data);
        setLoading(false);
      });
    }
  }, [user]);

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalXP = Math.floor(totalMinutes / 10);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 animate-in fade-in duration-500">
      {/* Header with Stats */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className={`${comfortaa.className} text-4xl font-black text-foreground`}>
            Scholar&apos;s Journal 📖
          </h1>
          <p className="text-muted-foreground font-medium">Your forest-walk of academic mastery.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="wooden-panel px-6 py-3 flex items-center gap-3 rounded-2xl border border-[rgba(212,184,122,0.2)]">
            <Trophy className="text-primary" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mastery XP</p>
              <p className="text-xl font-black text-primary">{totalXP}</p>
            </div>
          </div>
          <div className="wooden-panel px-6 py-3 flex items-center gap-3 rounded-2xl border border-[rgba(212,184,122,0.2)]">
            <Clock className="text-tomato" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Focus Time</p>
              <p className="text-xl font-black text-tomato">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Journal List */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-[#EDE8DC] rounded-full" />
        
        <div className="space-y-8 pl-16">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground font-bold italic">Opening the tomes...</div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ScrollText size={48} className="mx-auto text-[#EDE8DC]" />
              <p className="text-muted-foreground font-bold">The journal pages are empty. <br/>Start a session to begin your story.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const date = toDate(session.completedAt);
              return (
                <div key={session.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[3.25rem] top-6 w-4 h-4 rounded-full bg-white border-4 border-primary group-hover:scale-125 transition-transform" />
                  
                  {/* Journal Entry Card */}
                  <div className="bg-[#FEFCF7] p-6 rounded-[2rem] border-2 border-[rgba(212,184,122,0.15)] shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {date ? format(date, "EEEE, MMM do") : "A long time ago..."}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {session.type === "work" ? "Focus Session 🍅" : "Refresh Break 🌿"}
                          </span>
                        </div>
                        <h3 className={`${comfortaa.className} text-xl font-black text-foreground`}>
                          {session.lectureTitle || "Reflective Study"}
                        </h3>
                        <p className={`${handwriting.className} text-xl text-[#7A6348] mt-2`}>
                          Focused deeply for {session.durationMinutes} minutes on {session.subjectName || "Ancient Arts"}.
                          Mastery increased! 🌿✨
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-2xl border border-[rgba(212,184,122,0.1)]">
                        <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-muted-foreground">XP</p>
                          <p className="text-lg font-black text-primary">+{session.xpEarned}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-[#EDE8DC]" />
                        <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-muted-foreground">Time</p>
                          <p className="text-lg font-black text-tomato">{session.durationMinutes}m</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
