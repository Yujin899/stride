import { DayPlan } from "@/types";
import { BookOpen, Check, Play, Plus, ListChecks } from "lucide-react";

interface DayBoxProps {
  dayName: string;
  date: Date;
  plans?: DayPlan[];
  onAssign: () => void;
  onContinue: (plan: DayPlan) => void;
}

export default function DayBox({ plans = [], onAssign, onContinue }: DayBoxProps) {
  const activePlans = plans.filter(p => p.status !== "empty");
  const mainPlan = activePlans.find(p => p.status === "in_progress") || 
                   activePlans.find(p => p.status === "planned") || 
                   activePlans[0];
  
  const status = mainPlan?.status || "empty";
  const subjectColor = mainPlan?.subjectColor || "var(--border)";
  const moreCount = activePlans.length - 1;

  const renderContent = () => {
    if (activePlans.length === 0) {
      return (
        <button 
          onClick={onAssign}
          className="w-full h-full flex flex-col items-center justify-center gap-2 group transition-all"
        >
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-surface-section transition-all">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
            Assign
          </span>
        </button>
      );
    }

    // Multiple Quests Summary
    const isMultiple = activePlans.length > 1;

    switch (status) {
      case "planned":
      case "in_progress":
        return (
          <div className={`flex flex-col h-full p-3 justify-between ${status === 'in_progress' ? 'animate-pulse-warm rounded-2xl bg-surface-active/30' : ''}`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <BookOpen className="w-3 h-3 shrink-0" style={{ color: subjectColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground truncate">
                    Lvl {mainPlan?.lectureNumber}
                  </span>
                </div>
                {isMultiple && (
                  <div className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase whitespace-nowrap">
                    +{moreCount} More
                  </div>
                )}
              </div>
              <h4 className="font-display font-bold text-xs leading-tight sm:text-sm truncate" style={{ color: subjectColor }}>
                {mainPlan?.subjectName}
              </h4>
            </div>
            <button 
              onClick={() => onContinue(mainPlan!)}
              className={`mt-2 text-[10px] font-bold flex items-center gap-1 transition-colors ${status === 'in_progress' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              {status === 'in_progress' ? <><Play className="w-2.5 h-2.5 fill-current" /> Resume</> : <><Play className="w-2.5 h-2.5 fill-current" /> Start Quest</>}
            </button>
          </div>
        );

      case "done":
        const allDone = activePlans.every(p => p.status === "done");
        return (
          <div className="flex flex-col h-full p-3 items-center justify-center relative overflow-hidden bg-opacity-10 rounded-2xl" style={{ backgroundColor: `${subjectColor}20` }}>
            <div className="text-center z-10">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface shadow-sm mb-1">
                {allDone ? <Check className="w-5 h-5 text-secondary" /> : <ListChecks className="w-5 h-5 text-primary" />}
              </div>
              <h4 className="font-display font-bold text-xs line-through opacity-50 block truncate max-w-[80px]" style={{ color: subjectColor }}>
                {mainPlan?.subjectName}
              </h4>
              {isMultiple ? (
                <div className="mt-1 px-2 py-0.5 rounded-full bg-surface border border-border shadow-warm inline-block">
                  <span className="text-[8px] font-black text-primary uppercase">+{moreCount} More</span>
                </div>
              ) : mainPlan?.score && (
                <div className="mt-1 px-2 py-0.5 rounded-full bg-surface border border-border shadow-warm inline-block">
                  <span className="text-[9px] font-bold text-secondary">{mainPlan.score}%</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`relative w-full min-h-[100px] sm:min-h-[120px] rounded-2xl transition-all duration-300 ${
        activePlans.length === 0 
        ? "bg-transparent border-dashed border-border/50 border-2" 
        : "bg-surface shadow-sm hover:shadow-md border-2 border-transparent hover:border-primary/5"
      }`}
      style={{ 
        boxShadow: status === "in_progress" ? `0 0 20px ${subjectColor}20` : undefined
      }}
    >
      {renderContent()}
    </div>
  );
}
