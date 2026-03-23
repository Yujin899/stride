"use client";

import { WeekPlan, DayPlan, Subject } from "@/types";
import DayBox from "./DayBox";
import { format } from "date-fns";

interface WeeklyGridProps {
  dates: Date[];
  weekPlan: WeekPlan | null;
  subjects: Subject[];
  onAssignDay: (date: Date, dayName: string, plan?: DayPlan | null) => void;
  getDayPlans: (dayName: string) => DayPlan[];
  onContinue: (plan: DayPlan) => void;
}

export default function WeeklyGrid({ dates, weekPlan, subjects, onAssignDay, getDayPlans, onContinue }: WeeklyGridProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = { weekPlan, subjects }; // keep for future filters if needed
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="w-full overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
      <div className="grid grid-cols-7 gap-3 sm:gap-4 min-w-[800px] lg:min-w-0">
        {dayNames.map((day, index) => {
          const date = dates[index];
          const lowerDay = day.toLowerCase();
          const plans = getDayPlans(lowerDay);

          return (
            <div key={day} className="space-y-3 flex flex-col items-center">
              {/* Day Header */}
              <div className="text-center group">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                  {day.slice(0, 3)}
                </p>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-display font-bold transition-all ${
                  format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? "bg-primary text-white scale-110 shadow-sm"
                  : "text-foreground group-hover:bg-surface-section"
                }`}>
                  {format(date, 'd')}
                </div>
              </div>

              {/* Day Content */}
              <DayBox 
                dayName={day}
                date={date}
                plans={plans}
                onAssign={() => onAssignDay(date, lowerDay)}
                onContinue={onContinue}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
