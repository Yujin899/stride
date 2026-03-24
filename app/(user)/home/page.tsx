"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { 
  getOrCreateWeekPlan, 
  getSubjects, 
  updateDayPlansArr 
} from "@/lib/weekplan-service";
import { WeekPlan, Subject, DayPlan } from "@/types";
import { Timestamp } from "firebase/firestore";
import TodayQuest from "@/components/home/TodayQuest";
import AssignModal from "@/components/home/AssignModal";
import { getUserSessions } from "@/lib/weekplan-service";
import { StudySession } from "@/types";
import { format } from "date-fns";
import { ChevronRight, Loader2, AlertCircle, History as HistoryIcon, LayoutDashboard, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeAssignDay, setActiveAssignDay] = useState<{date: Date, name: string} | null>(null);
  const [editingPlan, setEditingPlan] = useState<DayPlan | null>(null);

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const [plan, subjs, sessions] = await Promise.all([
          getOrCreateWeekPlan(user.id, new Date()),
          getSubjects(),
          getUserSessions(user.id)
        ]);
        setWeekPlan(plan);
        setSubjects(subjs);
        
        // Filter sessions for today
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const filtered = sessions.filter(s => {
          if (!s.completedAt) return false;
          // Robust check for Firebase Timestamp or JS Date
          const completedAt = s.completedAt as Timestamp | Date;
          const d = (completedAt as Timestamp).toDate ? (completedAt as Timestamp).toDate() : completedAt as Date;
          const sDate = format(d, 'yyyy-MM-dd');
          return sDate === todayStr && s.type === 'work';
        });
        setTodaySessions(filtered);
      } catch (err: unknown) {
        console.error("HomePage initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user?.id]);


  // Handle Assignment
  const handleOpenAssign = (date: Date, dayName: string, plan: DayPlan | null = null) => {
    setActiveAssignDay({ date, name: dayName });
    setEditingPlan(plan);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (plan: DayPlan) => {
    if (!user?.id || !activeAssignDay || !weekPlan) return;

    const dayName = activeAssignDay.name.toLowerCase();
    const currentDayPlans = getDayPlans(dayName);
    
    let updatedPlans: DayPlan[];
    if (editingPlan) {
      // Update existing
      updatedPlans = currentDayPlans.map(p => p.id === plan.id ? plan : p);
    } else {
      // Add new
      updatedPlans = [...currentDayPlans, plan];
    }

    try {
      await updateDayPlansArr(user.id, new Date(), dayName, updatedPlans);
      // Local update
      setWeekPlan({
        ...weekPlan,
        days: { ...weekPlan.days, [dayName]: updatedPlans }
      });
      setIsAssignModalOpen(false);
      setEditingPlan(null);
    } catch (err) {
      console.error("Assignment error:", err);
    }
  };

  const handleDeleteQuest = async (dayName: string, planId: string) => {
    if (!user?.id || !weekPlan) return;
    
    const day = dayName.toLowerCase();
    const updatedPlans = getDayPlans(day).filter(p => p.id !== planId);

    try {
      await updateDayPlansArr(user.id, new Date(), day, updatedPlans);
      setWeekPlan({
        ...weekPlan,
        days: { ...weekPlan.days, [day]: updatedPlans }
      });
    } catch (err) {
      console.error("Delete quest error:", err);
    }
  };

  // Helper for Data Migration & Access
  const getDayPlans = (dayName: string): DayPlan[] => {
    if (!weekPlan) return [];
    const days = weekPlan.days as Record<string, DayPlan[] | DayPlan>;
    const dayData = days[dayName.toLowerCase()];
    if (Array.isArray(dayData)) return dayData;
    // Migration: If it's a single object (old format), wrap in array
    if (dayData && (dayData as DayPlan).status !== 'empty') {
       return [{ ...dayData as DayPlan, id: (dayData as DayPlan).id || crypto.randomUUID() }];
    }
    return [];
  };

  // Get Today's Plans
  const getTodayPlans = () => {
    if (!weekPlan) return [];
    const todayName = format(new Date(), 'eeee').toLowerCase();
    return getDayPlans(todayName);
  };

  // Calculate Weekly Progress
  const getWeeklyProgress = () => {
    if (!weekPlan) return { total: 0, done: 0, percent: 0 };
    let total = 0;
    let done = 0;
    
    Object.values(weekPlan.days).forEach((dayPlans: DayPlan[] | any) => {
      const plans = Array.isArray(dayPlans) ? dayPlans : (dayPlans.status !== 'empty' ? [dayPlans as DayPlan] : []);
      plans.forEach(p => {
        total++;
        if (p.status === "done") done++;
      });
    });

    return {
      total,
      done,
      percent: total > 0 ? Math.round((done / total) * 100) : 0
    };
  };

  const weeklyStats = getWeeklyProgress();

  if (isLoading && !weekPlan) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-display font-bold">Syncing chronometer...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pb-24 animate-in fade-in duration-1000">
      {/* Visual Identity Layer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-linear-to-b from-primary/5 to-transparent -z-10 rounded-full blur-3xl" />

      {/* Header & Stats (Tomato Counter) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Howdy, Scholar! 🌿
          </h1>
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
            {format(new Date(), 'EEEE, MMMM do')}
          </p>
        </div>

        {/* Tomato Counter Div */}
        <div className="wooden-panel p-4! bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-primary/10 shadow-sm flex flex-col items-center sm:items-end gap-3 min-w-[200px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Today&apos;s Focus Blooms</span>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
            {todaySessions.length > 0 ? (
              todaySessions.map((_, i) => (
                <div key={i} className="animate-in zoom-in duration-500 delay-100 bounce-subtle">
                  <Image src="/tomato.png" alt="Tomato" width={32} height={32} className="object-contain drop-shadow-md" />
                </div>
              ))
            ) : (
              <span className="text-xs font-bold text-muted-foreground/40 italic">Start your first session to bloom...</span>
            )}
          </div>
          {todaySessions.length > 0 && (
            <span className="text-[10px] font-bold text-secondary">{todaySessions.length} Focus Session{todaySessions.length > 1 ? 's' : ''} Completed</span>
          )}
        </div>
      </div>

      {/* Weekly Progress Meter */}
      <div className="px-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Weekly Mastery Progress</h3>
            <span className="text-[9px] sm:text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{weeklyStats.percent}%</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{weeklyStats.done} of {weeklyStats.total} Quests Secured</span>
        </div>
        <div className="h-2 w-full bg-surface-active rounded-full overflow-hidden border border-border/5">
          <div 
            className="h-full bg-linear-to-r from-primary to-secondary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(212,184,122,0.3)]"
            style={{ width: `${weeklyStats.percent}%` }}
          />
        </div>
      </div>

      {/* Quick Exploration - MOVED TO TOP */}
      <div className="space-y-4 px-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Quick Exploration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push("/study")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-primary/5!"
          >
            <div>
              <h4 className="font-black text-primary group-hover:underline uppercase tracking-tighter text-sm">Study Hall</h4>
              <p className="text-[10px] font-bold text-muted-foreground">Continue learning</p>
            </div>
            <ChevronRight size={18} className="text-primary/40 group-hover:text-primary transition-colors" />
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

          <button 
            onClick={() => router.push("/admin/upload")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-blue-500/5!"
          >
            <div>
              <h4 className="font-black text-blue-600 group-hover:underline uppercase tracking-tighter text-sm">Admin Portal</h4>
              <p className="text-[10px] font-bold text-muted-foreground">Manage content</p>
            </div>
            <LayoutDashboard size={18} className="text-blue-500/40 group-hover:text-blue-600 transition-colors" />
          </button>

          <button 
            onClick={() => router.push("/league")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-yellow-500/5!"
          >
            <div>
              <h4 className="font-black text-yellow-600 group-hover:underline uppercase tracking-tighter text-sm">Stride League</h4>
              <p className="text-[10px] font-bold text-muted-foreground">Climb the ranks</p>
            </div>
            <Trophy size={18} className="text-yellow-500/40 group-hover:text-yellow-600 transition-colors" />
          </button>

          <button 
            onClick={() => router.push("/week-plan")}
            className="wooden-panel p-5! text-left hover:translate-y-[-2px] hover:shadow-lg active:translate-y-px active:shadow-sm transition-all group flex items-center justify-between bg-emerald-500/5!"
          >
            <div>
              <h4 className="font-black text-emerald-600 group-hover:underline uppercase tracking-tighter text-sm">Week Scroll</h4>
              <p className="text-[10px] font-bold text-muted-foreground">The full journey</p>
            </div>
            <HistoryIcon size={18} className="text-emerald-500/40 group-hover:text-emerald-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Today's Quests */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            Today&apos;s Scroll <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">Current Quests</span>
          </h2>
          <button 
            onClick={() => handleOpenAssign(new Date(), format(new Date(), 'eeee'))}
            className="text-xs font-black text-primary hover:underline hover:scale-105 transition-transform"
          >
            + Add Task
          </button>
        </div>

        <TodayQuest 
          plans={getTodayPlans()}
          onStart={(plan) => router.push(`/study/${plan.lectureId}`)}
          onEdit={(plan) => handleOpenAssign(new Date(), format(new Date(), 'eeee').toLowerCase(), plan)}
          onDelete={(plan) => handleDeleteQuest(format(new Date(), 'eeee'), plan.id)}
          onAssign={() => handleOpenAssign(new Date(), format(new Date(), 'eeee').toLowerCase())}
        />
      </div>


      {/* Assignment Modal */}
      <AssignModal 
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setEditingPlan(null); }}
        subjects={subjects}
        onAssign={handleAssignSubmit}
        editingPlan={editingPlan}
      />
    </div>
  );
}
