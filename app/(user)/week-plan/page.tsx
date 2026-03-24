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
import { comfortaa, nunito } from "@/lib/fonts";
import { ChevronLeft, Loader2, Calendar, Sparkles, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, isBefore, startOfDay } from "date-fns";

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
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);

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
        
        // Auto-select today
        const todayName = format(new Date(), 'eeee').toLowerCase();
        setSelectedDayDetail(todayName);
      } catch (err) {
        console.error("WeekPlanPage init error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user?.id]);

  // Handlers
  const getDayPlans = (dayName: string): DayPlan[] => {
    if (!weekPlan) return [];
    const days = weekPlan.days as Record<string, DayPlan[] | DayPlan>;
    const dayData = days[dayName.toLowerCase()];
    if (Array.isArray(dayData)) return dayData;
    if (dayData && (dayData as DayPlan).status !== 'empty') {
       return [{ ...dayData as DayPlan, id: (dayData as DayPlan).id || crypto.randomUUID() }];
    }
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

  const handleDeleteQuest = async (dayName: string, planId: string) => {
    if (!user?.id || !weekPlan) return;
    const day = dayName.toLowerCase();
    const updatedPlans = getDayPlans(day).filter(p => p.id !== planId);
    try {
      await updateDayPlansArr(user.id, new Date(), day, updatedPlans);
      setWeekPlan({ ...weekPlan, days: { ...weekPlan.days, [day]: updatedPlans } });
    } catch (err) {
      console.error("Delete quest error:", err);
    }
  };

  const getWeeklyStats = () => {
    if (!weekPlan) return { total: 0, done: 0, percent: 0 };
    let total = 0;
    let done = 0;
    Object.keys(weekPlan.days).forEach(day => {
      const plans = getDayPlans(day);
      plans.forEach(p => {
        total++;
        if (p.status === 'done') done++;
      });
    });
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const stats = getWeeklyStats();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic animate-pulse">Unrolling the Weekly Scroll...</p>
      </div>
    );
  }

  const selectedPlans = selectedDayDetail ? getDayPlans(selectedDayDetail) : [];
  const selectedDate = selectedDayDetail ? dates[["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(selectedDayDetail)] : null;
  const isPast = selectedDate ? isBefore(startOfDay(selectedDate), startOfDay(new Date())) : false;

  return (
    <div className={`max-w-7xl mx-auto space-y-10 pb-24 ${nunito.className}`}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="space-y-4">
          <Link 
            href="/home"
            className="flex items-center gap-2 text-muted-foreground/60 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-all group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="space-y-1">
             <h1 className={`${comfortaa.className} text-4xl sm:text-5xl text-foreground font-bold tracking-tight`}>
               Weekly Scroll 📜
             </h1>
             <p className="text-sm text-muted-foreground font-medium max-w-md">
               Behold your scholarly journey. Manage multiple quests and master the arts of dental science.
             </p>
          </div>
        </div>

        {/* Global Progress Card */}
        <div className="wooden-panel p-6! bg-white/40 backdrop-blur-md rounded-3xl border border-primary/10 shadow-xl min-w-[280px] space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Weekly Mastery</p>
              <h3 className="text-2xl font-black text-foreground">{stats.done} <span className="text-sm text-muted-foreground/60">/ {stats.total} secured</span></h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
              {stats.percent}%
            </div>
          </div>
          <div className="h-2 w-full bg-surface-active rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-primary to-secondary transition-all duration-1000" 
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* Left Column: The Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="wooden-panel p-8! bg-white shadow-2xl border border-primary/5 rounded-5xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 transform rotate-12 opacity-5 pointer-events-none">
               <Calendar size={120} />
            </div>
            
            <WeeklyGrid 
              dates={dates}
              weekPlan={weekPlan}
              subjects={subjects}
              onAssignDay={(date, day) => {
                setSelectedDayDetail(day);
                handleOpenAssign(date, day);
              }}
              getDayPlans={(day) => {
                const plans = getDayPlans(day);
                return plans;
              }}
              onContinue={(plan) => {
                setSelectedDayDetail(plan.id ? getDayNameById(plan.id) : null);
                router.push(`/study/${plan.lectureId}`);
              }}
            />
            
            {/* Legend/Info */}
            <div className="mt-8 pt-6 border-t border-surface-section flex flex-wrap gap-4 justify-center sm:justify-start">
               {["#8B6914", "#4A8A5F", "#C94A35"].map((c, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{i === 0 ? 'Planned' : i === 1 ? 'Secured' : 'Critique'}</span>
                 </div>
               ))}
               <p className="text-[10px] font-bold text-muted-foreground/40 italic ml-auto">Click a day to focus your lens.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Daily Focus Detail */}
        <div className="lg:col-span-4 space-y-6">
          <div className="wooden-panel p-6! bg-surface h-full min-h-[400px] border border-primary/10 rounded-4xl shadow-lg flex flex-col">
            {selectedDayDetail && selectedDate ? (
              <div className="space-y-6 flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Daily Focus detail</p>
                  <h3 className="text-2xl font-black text-foreground capitalize">{selectedDayDetail}</h3>
                  <p className="text-xs font-bold text-muted-foreground">{format(selectedDate, 'MMMM do, yyyy')}</p>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedPlans.length > 0 ? (
                    selectedPlans.map((plan) => (
                      <div 
                        key={plan.id}
                        className="p-4 rounded-2xl bg-white border border-primary/5 shadow-sm hover:shadow-md transition-all group relative"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.subjectColor }} />
                               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Lecture {plan.lectureNumber}</span>
                            </div>
                            <h4 className="text-sm font-black text-foreground">{plan.subjectName}</h4>
                            <div className="flex items-center gap-2">
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                 plan.status === 'done' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                               }`}>
                                 {plan.status}
                               </span>
                               {plan.score && <span className="text-[9px] font-black text-muted-foreground opacity-60">{plan.score}% Mastery</span>}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                             <button 
                               onClick={() => router.push(`/study/${plan.lectureId}`)}
                               className="p-2 rounded-xl bg-primary text-white hover:scale-105 transition-all shadow-sm"
                               title="Resume Quest"
                             >
                               <Play size={14} fill="currentColor" />
                             </button>
                             <button 
                               onClick={() => handleOpenAssign(selectedDate!, selectedDayDetail!, plan)}
                               className="p-2 rounded-xl bg-surface-section text-muted-foreground hover:text-primary transition-all"
                               title="Edit Quest"
                             >
                               <Sparkles size={14} />
                             </button>
                             <button 
                               onClick={() => handleDeleteQuest(selectedDayDetail!, plan.id || "")}
                               className="p-2 rounded-xl bg-tomato/10 text-tomato hover:bg-tomato hover:text-white transition-all shadow-xs"
                               title="Retract Quest"
                             >
                               <X size={14} />
                             </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-40">
                       <Sparkles size={48} className="text-primary/20" />
                       <p className="text-xs font-bold text-muted-foreground">Select a scholarly task to begin your focus session.</p>
                       {!isPast && (
                         <button 
                           onClick={() => handleOpenAssign(selectedDate, selectedDayDetail)}
                           className="text-[10px] font-black text-primary uppercase underline tracking-widest"
                         >
                           Assign First Quest
                         </button>
                       )}
                    </div>
                  )}
                </div>

                {!isPast && (
                  <button 
                    onClick={() => handleOpenAssign(selectedDate, selectedDayDetail)}
                    className="w-full py-4 mt-6 rounded-2xl border-2 border-dashed border-primary/20 text-xs font-black text-primary/60 hover:bg-primary hover:text-white hover:border-solid transition-all uppercase tracking-widest bg-white"
                  >
                    + Add Another Quest
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-40">
                <Calendar size={48} />
                <p className="text-sm font-bold text-muted-foreground">Select a day from your scroll to view specific focus tasks.</p>
              </div>
            )}
          </div>
        </div>
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

  function getDayNameById(id: string) {
    if (!weekPlan) return null;
    for (const [day, plans] of Object.entries(weekPlan.days)) {
      if (Array.isArray(plans) && plans.find(p => p.id === id)) return day;
    }
    return null;
  }
}

