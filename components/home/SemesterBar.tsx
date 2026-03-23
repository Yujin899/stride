"use client";

interface SemesterBarProps {
  percentage: number;
}

export default function SemesterBar({ percentage }: SemesterBarProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end px-1">
        <div>
          <h3 className="text-sm font-display font-bold text-foreground">Semester Progress</h3>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Digital Scholorship</p>
        </div>
        <span className="text-lg font-display font-bold text-secondary">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-4 w-full bg-surface-section rounded-full shadow-sm overflow-hidden p-0.5">
        <div 
          className="h-full bg-secondary rounded-full border border-white/20 transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
