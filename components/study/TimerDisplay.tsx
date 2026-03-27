"use client";

import { Comfortaa } from "next/font/google";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });

interface TimerDisplayProps {
  mode: "work" | "break" | "completed";
  isRinging: boolean;
  digitalTime: string | number;
}

export default function TimerDisplay({ 
  mode, 
  isRinging, 
  digitalTime,
}: TimerDisplayProps) {
  
  return (
    <div className={`relative flex flex-col items-center justify-center w-72 h-72 mx-auto rounded-full border-8 transition-all duration-300 ${
      isRinging ? "animate-ring scale-110 border-tomato" : 
      mode === "work" ? "border-tomato/30" : "border-green-500/30"
    } bg-white shadow-xl`}>
      {/* Visual Indicator of Mode */}
      <div className={`absolute top-10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        mode === "work" ? "bg-tomato/10 text-tomato" : "bg-green-500/10 text-green-600"
      }`}>
        {mode === "work" ? "Focus" : "Break"}
      </div>

      {/* Digital Time */}
      <span className={`${comfortaa.className} text-7xl font-black ${
        mode === "work" ? "text-tomato" : "text-green-500"
      } tracking-tighter drop-shadow-sm`}>
        {digitalTime}
      </span>

      {/* Subtle Progress Ring or Status */}
      <div className={`mt-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest`}>
        {isRinging ? "Time's Up!" : mode === "work" ? "Studying..." : "Refreshing..."}
      </div>
    </div>
  );
}
