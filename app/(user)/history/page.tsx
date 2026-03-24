"use client";

import { useState, useEffect } from "react";
import { getAllSessions } from "@/lib/weekplan-service";
import { StudySession, User } from "@/types";
import { Comfortaa } from "next/font/google";
import AncientChronicleBook from "@/components/history/AncientChronicleBook";
import { Trophy, Clock, ScrollText } from "lucide-react";
import { getDocs } from "firebase/firestore";
import { usersCol } from "@/lib/firebase/collections";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });

export default function HistoryPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all sessions (Global History)
        const sessionsData = await getAllSessions();
        setSessions(sessionsData);

        // Fetch all users to map userIds to names
        const usersSnap = await getDocs(usersCol);
        const usersData: Record<string, string> = {};
        usersSnap.docs.forEach(doc => {
          const u = doc.data() as User;
          usersData[doc.id] = u.name;
        });
        setUserMap(usersData);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalXP = Math.floor(totalMinutes / 10);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header with Stats */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <h1 className={`${comfortaa.className} text-4xl font-black text-foreground`}>
            World Chronicle 🌍
          </h1>
          <p className="text-muted-foreground font-medium">The collective legend of the Tomato People.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="wooden-panel px-6 py-3 flex items-center gap-3 rounded-2xl border border-[rgba(212,184,122,0.2)]">
            <Trophy className="text-primary" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global XP</p>
              <p className="text-xl font-black text-primary">{totalXP}</p>
            </div>
          </div>
          <div className="wooden-panel px-6 py-3 flex items-center gap-3 rounded-2xl border border-[rgba(212,184,122,0.2)]">
            <Clock className="text-tomato" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Focus</p>
              <p className="text-xl font-black text-tomato">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            </div>
          </div>
        </div>
      </header>

      {/* Immersive History View */}
      <div className="relative">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground font-bold italic animate-pulse">
            Consulting the ancient global tomes...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <ScrollText size={48} className="mx-auto text-[#EDE8DC]" />
            <p className="text-muted-foreground font-bold">The chronicle pages are empty. <br/>A new world awaits its first scholar.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-hidden md:overflow-x-visible">
            <AncientChronicleBook sessions={sessions} userMap={userMap} />
          </div>
        )}
      </div>
    </div>
  );
}
