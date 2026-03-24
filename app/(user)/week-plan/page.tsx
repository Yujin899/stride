"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { 
  getOrCreateWeekPlan, 
  getSubjects, 
  updateDayPlansArr,
  getWeekDates 
} from "@/lib/weekplan-service";
import { WeekPlan, Subject, DayPlan } from "@/types";
import WeeklyGrid from "@/components/home/WeeklyGrid";
import AssignModal from "@/components/home/AssignModal";
import { Comfortaa, Nunito } from "next/font/google";
import { ChevronLeft, Loader2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export default function WeekPlanPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeAssignDay, setActiveAssignDay] = useState<{date: Date, name: string} | null>(null);
  const [editingPlan, setEditingPlan] = useState<DayPlan | null>(null);

  const dates = getWeekDates(new Date());

  // Load Data
  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const [plan, subjs] = await Promise.all([
          getOrCreateWeekPlan(user.id, new Date()),
          getSubjects()
        ]);
        setWeekPlan(plan);
        setSubjects(subjs);
      } catch (err) {
        console.error("WeekPlanPage init error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user?.id]);

  // Handlers (Similar to Home but dedicated to the grid)
  const getDayPlans = (dayName: string): DayPlan[] => {
    if (!weekPlan) return [];
    const dayData = (weekPlan.days as any)[dayName.toLowerCase()];
    if (Array.isArray(dayData)) return dayData;
    if (dayData && dayData.status !== 'empty') return [dayData];
    return [];
  };

  const handleOpenAssign = (date: Date, dayName: string, plan: DayPlan | null = null) => {
    setActiveAssignDay({ date, name: dayName });
    setEditingPlan(plan);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (plan: DayPlan) => {
    if (!user?.id || !activeAssignDay || !weekPlan) return;
    const dayName = activeAssignDay.name.toLowerCase();
    const currentDayPlans = getDayPlans(dayName);
    const updatedPlans = editingPlan 
      ? currentDayPlans.map(p => p.id === plan.id ? plan : p)
      : [...currentDayPlans, plan];

    try {
      await updateDayPlansArr(user.id, new Date(), dayName, updatedPlans);
      setWeekPlan({ ...weekPlan, days: { ...weekPlan.days, [dayName]: updatedPlans } });
      setIsAssignModalOpen(false);
      setEditingPlan(null);
    } catch (err) {
      console.error("Assign error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic animate-pulse">Unrolling the Weekly Scroll...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto space-y-12 pb-20 ${nunito.className}`}>
      {/* Navigation */}
      <Link 
        href="/home"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold transition-colors group w-fit"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Return to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <Calendar size={14} /> Scholarly Schedule
          </div>
          <h1 className={`${comfortaa.className} text-4xl text-foreground font-bold`}>
            Your Weekly Journey 📜
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Week {format(new Date(), 'w, yyyy')} • Manage your quests and plan your mastery.
          </p>
        </div>

        <div className="wooden-panel p-4! bg-white/50 backdrop-blur-sm rounded-2xl flex items-center gap-4 border-2 border-primary/10 self-center md:self-auto">
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Current Goal</p>
             <p className="text-sm font-bold text-foreground">Secure All Quests</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
             <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* The Grid */}
      <div className="wooden-panel p-8! bg-white shadow-warm border-2 border-border/10 rounded-[2.5rem]">
        <WeeklyGrid 
          dates={dates}
          weekPlan={weekPlan}
          subjects={subjects}
          onAssignDay={handleOpenAssign}
          getDayPlans={getDayPlans}
          onContinue={(plan) => router.push(`/study/${plan.lectureId}`)}
        />
      </div>

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

// Sparkles local import if not in lucide
import { Sparkles } from "lucide-react";
