"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { 
  getOrCreateWeekPlan, 
  getWeekDates, 
  getSubjects, 
  updateDayPlansArr 
} from "@/lib/weekplan-service";
import { WeekPlan, Subject, DayPlan } from "@/types";
import WeeklyGrid from "@/components/home/WeeklyGrid";
import SemesterBar from "@/components/home/SemesterBar";
import TodayQuest from "@/components/home/TodayQuest";
import AssignModal from "@/components/home/AssignModal";
import { format, addWeeks, subWeeks, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
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
        const [plan, subjs] = await Promise.all([
          getOrCreateWeekPlan(user.id, currentDate),
          getSubjects()
        ]);
        setWeekPlan(plan);
        setSubjects(subjs);
      } catch (err: unknown) {
        console.error("HomePage initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user?.id, currentDate]);

  // Handle Week Navigation
  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));

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
      await updateDayPlansArr(user.id, currentDate, dayName, updatedPlans);
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
      await updateDayPlansArr(user.id, currentDate, day, updatedPlans);
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
    const dayData = (weekPlan.days as any)[dayName.toLowerCase()];
    if (Array.isArray(dayData)) return dayData;
    // Migration: If it's a single object (old format), wrap in array
    if (dayData && dayData.status !== 'empty') {
       return [{ ...dayData, id: dayData.id || crypto.randomUUID() }];
    }
    return [];
  };

  // Progress Calculations
  const calcSemesterProgress = () => {
    if (!weekPlan) return 0;
    const allPlans = Object.values(weekPlan.days).flat() as DayPlan[];
    const totalPlanned = allPlans.length;
    if (totalPlanned === 0) return 0;
    const doneCount = allPlans.filter(p => p.status === 'done').length;
    return (doneCount / totalPlanned) * 100;
  };

  // Get Today's Plans
  const getTodayPlans = () => {
    const todayName = format(new Date(), 'eeee').toLowerCase();
    const isThisWeek = format(currentDate, 'I-I') === format(new Date(), 'I-I');
    return isThisWeek ? getDayPlans(todayName) : [];
  };

  if (isLoading && !weekPlan) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-display font-bold">Syncing chronometer...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 sm:space-y-8 animate-in fade-in duration-1000">
      {/* Ad Image Layered - Universal Visibility (Mobile/Tablet/PC) */}
      <div className="absolute top-0 left-0 right-0 -m-4 sm:-m-6 lg:-m-8 -mt-[15px] lg:-mt-10 z-40 pointer-events-none opacity-90 overflow-hidden flex justify-center">
        <img src="/ad-1.png" alt="" className="w-full max-w-[300px] sm:max-w-md lg:max-w-xl h-auto object-contain" />
      </div>

      <div className="relative z-0 space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-2xl">
          <SemesterBar percentage={calcSemesterProgress()} />
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl shadow-sm scroll-mt-20">
          <button onClick={prevWeek} className="p-2 hover:bg-surface-active rounded-xl transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 border-x border-border/20">
            <Calendar size={16} className="text-secondary" />
            <span className="text-xs font-display font-bold text-foreground">
              Week {format(currentDate, 'w')} — {format(currentDate, 'MMMM yyyy')}
            </span>
          </div>
          <button onClick={nextWeek} className="p-2 hover:bg-surface-active rounded-xl transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Main Grid Area */}
        <div className="flex-1 space-y-6 overflow-hidden">
          <WeeklyGrid 
            dates={getWeekDates(currentDate)}
            weekPlan={weekPlan}
            subjects={subjects}
            onAssignDay={handleOpenAssign}
            getDayPlans={getDayPlans}
            onContinue={(plan) => router.push(`/study/${plan.lectureId}`)}
          />
        </div>

        {/* Quest Sidebar */}
        <div className="w-full lg:w-[320px] shrink-0">
          <TodayQuest 
            plans={getTodayPlans()}
            onStart={(plan) => router.push(`/study/${plan.lectureId}`)}
            onEdit={(plan) => handleOpenAssign(new Date(), format(new Date(), 'eeee').toLowerCase(), plan)}
            onDelete={(plan) => handleDeleteQuest(format(new Date(), 'eeee'), plan.id)}
            onAssign={() => handleOpenAssign(new Date(), format(new Date(), 'eeee').toLowerCase())}
          />
        </div>
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
    </div>
  );
}
