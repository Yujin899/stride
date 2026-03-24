import { DayPlan } from "@/types";
import { Check, Plus } from "lucide-react";
import { isBefore, startOfDay } from "date-fns";

interface DayBoxProps {
  dayName: string;
  date: Date;
  plans?: DayPlan[];
  onAssign: () => void;
  onContinue: (plan: DayPlan) => void;
}

export default function DayBox({ dayName, date, plans = [], onAssign, onContinue }: DayBoxProps) {
  const activePlans = plans.filter(p => p.status !== "empty");
  const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
  
  const renderContent = () => {
    if (activePlans.length === 0) {
      if (isPast) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20 min-h-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No Quests</span>
          </div>
        );
      }
      return (
        <button 
          onClick={onAssign}
          aria-label={`Assign quest for ${dayName}`}
          className="w-full h-full flex flex-col items-center justify-center gap-2 group transition-all min-h-[100px]"
        >
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-surface-section transition-all">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
            Assign Quest
          </span>
        </button>
      );
    }

    return (
      <div className="flex flex-col h-full w-full gap-1.5 p-1.5 overflow-hidden">
        {activePlans.slice(0, 3).map((plan, idx) => {
          const isDone = plan.status === "done";
          const isInProgress = plan.status === "in_progress";
          
          return (
            <button
              key={plan.id || idx}
              onClick={() => onContinue(plan)}
              className={`w-full text-left p-2 rounded-xl border transition-all relative group/item ${
                isDone 
                ? "bg-secondary/5 border-secondary/20 opacity-70 hover:opacity-100" 
                : isInProgress
                ? "bg-primary/5 border-primary/30 animate-pulse-warm"
                : "bg-surface border-border/40 hover:border-primary/30 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                   <div 
                     className="w-1.5 h-1.5 rounded-full shrink-0" 
                     style={{ backgroundColor: plan.subjectColor || 'var(--primary)' }} 
                   />
                   <span className="text-[9px] font-black uppercase tracking-tighter truncate text-muted-foreground/80">
                     Lec {plan.lectureNumber}
                   </span>
                </div>
                {isDone && <Check className="w-2.5 h-2.5 text-secondary shrink-0" />}
              </div>
              <h4 className="text-[10px] font-bold text-foreground truncate mt-0.5">
                {plan.subjectName}
              </h4>
            </button>
          );
        })}
        {activePlans.length > 3 && (
          <div className="text-[8px] font-black text-center text-primary/60 uppercase tracking-widest py-1 bg-primary/5 rounded-lg border border-primary/10">
            +{activePlans.length - 3} More
          </div>
        )}
        
        {!isPast && (
          <button 
            onClick={onAssign}
            className="mt-auto w-full py-1.5 border-2 border-dashed border-border/30 rounded-lg flex items-center justify-center hover:bg-surface-section transition-colors group"
          >
            <Plus className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`relative w-full min-h-[120px] rounded-2xl transition-all duration-300 ${
        activePlans.length === 0 
        ? "bg-transparent" 
        : "bg-surface-section/30 shadow-inner"
      }`}
    >
      {renderContent()}
    </div>
  );
}
