"use client";

import { useEffect, useState } from "react";
import { fetchAllSubjects } from "@/lib/admin-service";
import { Subject } from "@/types";
import { Comfortaa, Nunito } from "next/font/google";
import { GraduationCap, Loader2, ChevronLeft, Search, RotateCcw } from "lucide-react";
import PomodoroTimer from "@/components/study/PomodoroTimer";
import { useTimerStore } from "@/store/timerStore";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "800"] });

export default function PomodoroPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { initialWorkDuration, initialBreakDuration } = useTimerStore();

  useEffect(() => {
    async function init() {
      try {
        const subjs = await fetchAllSubjects();
        setSubjects(subjs);
      } catch (err) {
        console.error("Pomodoro init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Waking the Scholar...</p>
      </div>
    );
  }

  if (selectedSubject) {
    return (
      <div className={`max-w-4xl mx-auto space-y-8 ${nunito.className}`}>
        {/* Navigation */}
        <button 
          onClick={() => setSelectedSubject(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold transition-colors group w-fit"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Change Subject
        </button>

        {/* Header */}
        <div className="text-center space-y-4">
          <div 
            className="inline-flex items-center px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm bg-white"
            style={{ color: selectedSubject.color }}
          >
            {selectedSubject.name}
          </div>
          <h1 className={`${comfortaa.className} text-3xl sm:text-4xl text-foreground font-bold leading-tight`}>
            Focus Session: {selectedSubject.name}
          </h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            DEEP WORK MODE • POMODORO METHOD
          </p>
        </div>

        {/* Timer Section */}
        <PomodoroTimer 
          initialDuration={initialWorkDuration} 
          breakDuration={initialBreakDuration}
          subjectName={selectedSubject.name}
        />
        
        <div className="flex justify-center pt-4">
           <button 
             onClick={() => setSelectedSubject(null)}
             className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
           >
             <RotateCcw size={14} /> Reset and Choose Another Subject
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-10 pb-20 ${nunito.className}`}>
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className={`${comfortaa.className} text-3xl text-foreground font-bold`}>
          Pomodoro Mastery 🍅
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Select a subject to begin your focused study session using the Pomodoro technique.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text"
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface border-none shadow-sm rounded-2xl outline-none focus:ring-2 ring-primary/20 transition-all font-semibold text-sm"
        />
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setSelectedSubject(subject)}
            className="group relative bg-surface p-8 rounded-4xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] active:translate-y-0 transition-all text-left overflow-hidden border border-border/5"
          >
            <div 
              className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"
              style={{ backgroundColor: subject.color, borderRadius: '50%' }}
            />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                style={{ backgroundColor: subject.color }}
              >
                <GraduationCap size={28} />
              </div>
              
              <div>
                <h3 className={`${comfortaa.className} text-xl text-foreground font-bold mb-1`}>
                  {subject.name}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  Select to Start Timing
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {filteredSubjects.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <p className="text-muted-foreground font-semibold italic">No subjects found matching your search. 🌿</p>
        </div>
      )}
    </div>
  );
}
