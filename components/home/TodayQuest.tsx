import { Play, Sparkles, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { DayPlan } from "@/types";

interface TodayQuestProps {
  plans?: DayPlan[];
  onStart: (plan: DayPlan) => void;
  onEdit: (plan: DayPlan) => void;
  onDelete: (plan: DayPlan) => void;
  onAssign: () => void;
}

export default function TodayQuest({ plans = [], onStart, onEdit, onDelete, onAssign }: TodayQuestProps) {
  const activePlans = plans.filter(p => p.status !== "empty");

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
        {activePlans.length === 0 ? (
          <div className="flex-none w-full wooden-panel p-8 text-center space-y-3 bg-surface/30 border-dashed border-2">
            <p className="text-sm font-medium text-muted-foreground">
              No quests active for today.
            </p>
            <button 
              onClick={onAssign}
              className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:translate-y-[-2px] transition-all"
            >
              Assign Quest +
            </button>
          </div>
        ) : (
          <>
            {activePlans.map((plan) => (
              <div 
                key={plan.id}
                className={`flex-none w-[200px] snap-start wooden-panel p-4! bg-white rounded-2xl border-2 transition-all group relative overflow-hidden ${
                  plan.status === "done" 
                  ? "border-secondary/20 bg-secondary/5!" 
                  : "border-primary/10 hover:border-primary/30"
                }`}
              >
                {/* Compact Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(plan)} className="p-1 hover:bg-white rounded text-muted-foreground hover:text-primary"><Edit2 size={10} /></button>
                  <button onClick={() => onDelete(plan)} className="p-1 hover:bg-white rounded text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
                </div>

                <div className="space-y-2">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1" style={{ color: plan.status === "done" ? 'var(--secondary)' : 'var(--primary)' }}>
                    {plan.status === "done" ? <CheckCircle2 size={8} /> : <span>Lecture {plan.lectureNumber}</span>}
                    {plan.status === "done" && "Secured"}
                  </p>
                  
                  <h3 className={`font-display font-black text-sm leading-tight truncate ${plan.status === "done" ? "line-through opacity-40" : ""}`} style={{ color: plan.subjectColor }}>
                    {plan.subjectName}
                  </h3>

                  {plan.status !== "done" ? (
                    <button 
                      onClick={() => onStart(plan)}
                      className="w-full py-1.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary/10 transition-all flex items-center justify-center gap-2"
                    >
                      {plan.status === "in_progress" ? "Resume" : "Start"} <Play size={8} fill="currentColor" />
                    </button>
                  ) : (
                    <div className="text-[8px] font-bold text-secondary flex items-center gap-1">
                      <Sparkles size={8} /> +{plan.score || 0}% XP
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Quick Add Card */}
            <button 
              onClick={onAssign}
              className="flex-none w-[120px] snap-start wooden-panel border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Sparkles size={14} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Add Quest</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
