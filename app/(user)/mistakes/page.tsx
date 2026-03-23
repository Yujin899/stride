"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { getUserMistakes, markMistakeAsReviewed, MistakeWithContent } from "@/lib/mistake-service";
import { getSubjects, getOrCreateWeekPlan } from "@/lib/weekplan-service";
import { Subject, DayPlan } from "@/types";
import { Comfortaa, Nunito } from "next/font/google";
import { Check, X, Loader2, Filter, Info } from "lucide-react";
import SemesterBar from "@/components/home/SemesterBar";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export default function MistakesPage() {
  const { user } = useAuthStore();
  const [mistakes, setMistakes] = useState<MistakeWithContent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesterProgress, setSemesterProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSubjectId, setActiveSubjectId] = useState<string>("all");

  useEffect(() => {
    async function init() {
      if (!user?.id) return;
      try {
        const [mistakeData, subjectData, weekPlan] = await Promise.all([
          getUserMistakes(user.id),
          getSubjects(),
          getOrCreateWeekPlan(user.id, new Date())
        ]);

        setMistakes(mistakeData);
        setSubjects(subjectData);

        // Calc progress (simplification for this page)
        if (weekPlan) {
          const days = Object.values(weekPlan.days).flat();
          const totalPlanned = days.filter(d => d.status !== 'empty').length;
          const doneDays = days.filter(d => d.status === 'done').length;
          setSemesterProgress(totalPlanned > 0 ? (doneDays / totalPlanned) * 100 : 0);
        }
      } catch (err) {
        console.error("Mistakes load error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user?.id]);

  const handleMarkReviewed = async (id: string) => {
    try {
      await markMistakeAsReviewed(id);
      // Soft dim/remove effect
      setMistakes(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Mark reviewed error:", err);
    }
  };

  const filteredMistakes = useMemo(() => {
    if (activeSubjectId === "all") return mistakes;
    return mistakes.filter(m => m.subjectId === activeSubjectId);
  }, [mistakes, activeSubjectId]);

  const countsBySubject = useMemo(() => {
    const counts: Record<string, number> = { all: mistakes.length };
    mistakes.forEach(m => {
      counts[m.subjectId] = (counts[m.subjectId] || 0) + 1;
    });
    return counts;
  }, [mistakes]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Gathering Notes...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-10 pb-20 ${nunito.className}`}>
      {/* Header Section */}
      <div className="space-y-6">
        <h1 className={`${comfortaa.className} text-3xl text-foreground font-bold`}>
           Mistakes to Review Oops! 🌿
        </h1>
        <div className="max-w-2xl">
          <SemesterBar percentage={semesterProgress} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Filters - Sidebar on Desktop, Chips on Mobile */}
        <aside className="w-full lg:w-64 space-y-4 shrink-0">
          <div className="hidden lg:flex items-center gap-2 mb-4 px-2">
            <Filter size={16} className="text-muted-foreground" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Categories</h3>
          </div>

          {/* Mobile Filters (Horizontal Scroll) */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
            <button
              onClick={() => setActiveSubjectId("all")}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubjectId === "all" 
                ? "bg-surface-active text-primary shadow-sm" 
                : "bg-surface text-muted-foreground"
              }`}
            >
              All ({countsBySubject.all})
            </button>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSubjectId(s.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all`}
                style={{
                  backgroundColor: activeSubjectId === s.id ? `${s.color}15` : 'var(--surface)',
                  color: activeSubjectId === s.id ? s.color : 'var(--muted-foreground)',
                  boxShadow: activeSubjectId === s.id ? 'var(--shadow-warm)' : undefined
                }}
              >
                {s.name} ({countsBySubject[s.id] || 0})
              </button>
            ))}
          </div>

          {/* Desktop Filters (Vertical Tabs) */}
          <div className="hidden lg:flex flex-col gap-2">
            <button
              onClick={() => setActiveSubjectId("all")}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeSubjectId === "all" 
                ? "bg-surface-active text-primary shadow-sm pl-6" 
                : "text-muted-foreground hover:bg-surface-section"
              }`}
            >
              <span>All Mistakes</span>
              <span className="text-[10px] opacity-60 bg-white/50 px-2 py-0.5 rounded-full">{countsBySubject.all}</span>
            </button>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSubjectId(s.id)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:bg-surface-section"
                style={{
                  backgroundColor: activeSubjectId === s.id ? `${s.color}15` : undefined,
                  color: activeSubjectId === s.id ? s.color : undefined,
                  paddingLeft: activeSubjectId === s.id ? '1.5rem' : '1rem'
                }}
              >
                <span className="truncate">{s.name}</span>
                <span 
                  className="text-[10px] opacity-60 px-2 py-0.5 rounded-full bg-white/50"
                >
                  {countsBySubject[s.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 w-full">
          {filteredMistakes.length > 0 ? (
            <div className="space-y-6">
              {filteredMistakes.map((mistake) => {
                const subj = subjects.find(s => s.id === mistake.subjectId);
                return (
                  <div 
                    key={mistake.id}
                    className="wooden-panel p-6! sm:p-8! bg-white rounded-3xl shadow-warm border-2 border-border/50 relative overflow-hidden transition-all duration-300"
                  >
                    {/* Left Accent */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: subj?.color || 'var(--primary)' }}
                    />

                    <div className="space-y-6">
                      {/* Card Header */}
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                        <span style={{ color: subj?.color }}>{subj?.name}</span>
                        <span>•</span>
                        <span>Lecture {mistake.lectureNumber}</span>
                      </div>

                      {/* Question */}
                      <h2 className={`${comfortaa.className} text-lg sm:text-xl text-foreground font-bold leading-snug`}>
                        {mistake.question?.text}
                      </h2>

                      {/* Options Review */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-tomato/5 border border-tomato/10 text-tomato">
                          <X size={18} className="shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Answer</p>
                            <p className="text-sm font-bold">{mistake.question?.options[mistake.question.correctIndex === 0 ? 1 : 0] /* Mocked previous wrong answer logic for now */ || "Wrong selection"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/10 text-secondary">
                          <Check size={18} className="shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Correct Answer</p>
                            <p className="text-sm font-bold">{mistake.question?.options[mistake.question.correctIndex]}</p>
                          </div>
                        </div>
                      </div>

                      {/* Explanation Box */}
                      {mistake.question?.explanation && (
                        <div className="bg-[#EDE8DC] p-5 rounded-2xl border border-[#D9D3C0] shadow-inner relative">
                          <div className="flex items-center gap-2 mb-2 text-primary">
                            <Info size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Mastery Note</span>
                          </div>
                          <p className="text-sm text-[#7A7463] font-semibold leading-relaxed">
                            {mistake.question.explanation}
                          </p>
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => handleMarkReviewed(mistake.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-secondary hover:bg-secondary/5 transition-all group"
                        >
                          Mark Reviewed
                          <Check size={16} className="group-hover:scale-125 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="text-6xl grayscale opacity-50">🌿</div>
              <div className="space-y-2">
                <h3 className={`${comfortaa.className} text-2xl text-foreground font-bold`}>
                  Clear skies! 🌿
                </h3>
                <p className="text-muted-foreground text-sm font-medium">
                  No mistakes found here. Your knowledge is as solid as white marble.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
