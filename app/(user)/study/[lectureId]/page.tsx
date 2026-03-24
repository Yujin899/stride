"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Lecture, Subject } from "@/types";
import { ChevronLeft, Settings2, Loader2 } from "lucide-react";
import PomodoroTimer from "@/components/study/PomodoroTimer";
import { comfortaa, nunito } from "@/lib/fonts";
import { useTimerStore } from "@/store/timerStore";

export default function StudyPage() {
  const { lectureId } = useParams();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  const { initialWorkDuration, initialBreakDuration, setDurations } = useTimerStore();
  const [workDuration, setWorkDuration] = useState(initialWorkDuration);
  const [breakDuration, setBreakDuration] = useState(initialBreakDuration);
  const [activeDuration, setActiveDuration] = useState(initialWorkDuration);
  const [activeBreak, setActiveBreak] = useState(initialBreakDuration);
  const [timerKey, setTimerKey] = useState(0);

  // Fetch Data
  useEffect(() => {
    async function init() {
      if (!lectureId) return;
      try {
        const lectRef = doc(db, "lectures", lectureId as string);
        const lectSnap = await getDoc(lectRef);
        
        if (lectSnap.exists()) {
          const lectData = { id: lectSnap.id, ...lectSnap.data() } as Lecture;
          setLecture(lectData);
          
          const subRef = doc(db, "subjects", lectData.subjectId);
          const subSnap = await getDoc(subRef);
          if (subSnap.exists()) {
            setSubject({ id: subSnap.id, ...subSnap.data() } as Subject);
          }
        }
      } catch (err) {
        console.error("Study init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [lectureId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Initialising Session...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-12 ${nunito.className}`}>
      {/* Navigation */}
      <Link 
        href="/home"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold transition-colors group w-fit"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="text-center space-y-4">
        <div 
          className="inline-flex items-center px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm bg-white"
          style={{ color: subject?.color || 'var(--primary)' }}
        >
          {subject?.name || "Dental Science"}
        </div>
        <h1 className={`${comfortaa.className} text-3xl sm:text-4xl text-foreground font-bold leading-tight`}>
          {lecture ? `Lecture ${lecture.order}: Mastery Session` : "Lecture Session"}
        </h1>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
          {lectureId?.toString().slice(0, 8)} • POMODORO METHOD
        </p>
      </div>

      {/* Timer Section */}
      <PomodoroTimer 
        key={timerKey}
        initialDuration={activeDuration} 
        breakDuration={activeBreak}
        lectureId={lectureId as string}
        lectureTitle={lecture ? `Lecture ${lecture.order}` : undefined}
        subjectName={subject?.name}
      />

      {/* Settings Panel */}
      <div className="wooden-panel p-8! bg-surface-active/30 rounded-3xl shadow-sm max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Settings2 size={18} />
          </div>
          <h3 className={`${comfortaa.className} text-lg text-foreground font-bold`}>
            Timer Stats 🌿
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-6 relative">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Work Duration</label>
            <div className="flex items-center bg-white rounded-2xl p-4 shadow-sm group focus-within:ring-2 ring-primary/20 transition-all">
              <input 
                type="number" 
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="w-full text-lg font-bold text-foreground outline-none bg-transparent"
              />
              <span className="text-xs font-bold text-muted-foreground">MIN</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Break Duration</label>
            <div className="flex items-center bg-white rounded-2xl p-4 shadow-sm group focus-within:ring-2 ring-primary/20 transition-all">
              <input 
                type="number" 
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-full text-lg font-bold text-foreground outline-none bg-transparent"
              />
              <span className="text-xs font-bold text-muted-foreground">MIN</span>
            </div>
          </div>

          <div className="col-span-2 pt-4">
            <button 
              onClick={() => {
                const w = Math.max(1, workDuration);
                const b = Math.max(1, breakDuration);
                setDurations(w, b);
                setActiveDuration(w);
                setActiveBreak(b);
                setTimerKey(prev => prev + 1); // Refresh timer with new settings
              }}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Update Timer Settings 🌿
            </button>
            <p className="text-[10px] text-center mt-3 font-bold text-muted-foreground uppercase tracking-tighter opacity-50">
              Note: Updating will reset the current session
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
