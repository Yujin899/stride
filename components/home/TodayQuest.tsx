import { Target, Play, Sparkles, Sprout, Edit2, Trash2, CheckCircle2 } from "lucide-react";
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
  const isAllDone = activePlans.length > 0 && activePlans.every(p => p.status === "done");

  return (
    <div className="wooden-panel space-y-6 p-6 shadow-sm min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between border-b border-surface-section pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Target size={24} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-foreground leading-none">Quests</h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Daily Objectives</span>
          </div>
        </div>
        {activePlans.length > 0 && (
          <button 
            onClick={onAssign}
            className="p-2 hover:bg-surface-section rounded-lg transition-colors text-primary"
            title="Add another quest"
          >
            <Sparkles size={18} />
          </button>
        )}
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {activePlans.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center flex-wrap gap-2 opacity-30 grayscale">
              <Sprout size={60} className="text-secondary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground px-4">
              Rest day? Or just haven&apos;t chosen your hero&apos;s path for today?
            </p>
            <button 
              onClick={onAssign}
              className="px-6 py-2.5 rounded-xl border-2 border-border text-foreground text-xs font-bold hover:bg-surface-section transition-all uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
            >
              Assign Quest <Sparkles size={14} className="text-secondary" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activePlans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative p-4 rounded-2xl border-2 transition-all group ${
                  plan.status === "done" 
                  ? "bg-secondary/5 border-secondary/20" 
                  : "bg-surface-active/30 border-primary/10 hover:border-primary/30"
                }`}
              >
                {/* Actions Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(plan)}
                    className="p-1.5 hover:bg-white rounded-md text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={() => onDelete(plan)}
                    className="p-1.5 hover:bg-white rounded-md text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="space-y-1 pr-14">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: plan.status === "done" ? 'var(--secondary)' : 'var(--primary)' }}>
                    {plan.status === "done" ? "Objective Secured" : `Level ${plan.lectureNumber}`}
                  </p>
                  <h3 className={`font-display font-bold text-base leading-tight ${plan.status === "done" ? "line-through opacity-60" : ""}`} style={{ color: plan.subjectColor }}>
                    {plan.subjectName}
                  </h3>
                  {plan.status === "done" && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-secondary mt-1">
                      <CheckCircle2 size={10} /> +{plan.score || 0}% XP Earned
                    </div>
                  )}
                </div>
                
                {plan.status !== "done" && (
                  <button 
                    onClick={() => onStart(plan)}
                    className="mt-3 w-full py-2 bg-white/50 hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-primary border border-primary/10 transition-all flex items-center justify-center gap-2"
                  >
                    {plan.status === "in_progress" ? "Resume" : "Start"} <Play size={10} fill="currentColor" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Bonus Tip */}
      <div className="pt-4 border-t border-surface-section">
        {isAllDone ? (
          <p className="text-[10px] font-bold text-secondary text-center animate-pulse">
            🌟 All daily scrolls mastered! +50 Streak XP
          </p>
        ) : (
          <p className="text-[10px] italic text-muted-foreground/70 text-center">
            &quot;Consistency is the scholar&apos;s strongest armor.&quot;
          </p>
        )}
      </div>
    </div>
  );
}
