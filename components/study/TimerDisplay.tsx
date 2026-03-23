"use client";

import { Comfortaa } from "next/font/google";
import Image from "next/image";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });

interface TimerDisplayProps {
  mode: "work" | "break" | "completed";
  timeLeft: number;
  duration: number;
  isRinging: boolean;
  minuteRotation: number;
  secondRotation: number;
  digitalTime: string | number;
  qValues: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export default function TimerDisplay({ 
  mode, 
  isRinging, 
  minuteRotation, 
  secondRotation, 
  digitalTime, 
  qValues
}: TimerDisplayProps) {
  
  return (
    <div className={`relative flex flex-col items-center justify-center w-80 h-80 mx-auto transition-all duration-300 ${isRinging ? "animate-ring scale-110" : ""}`}>
      {/* Clock Face Rendering */}
      <div className="relative w-full h-full transition-all">
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <Image src="/clock.png" alt="Clock" fill className="object-contain" priority />
        </div>

        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 select-none pointer-events-none">
          <text x="50" y="38" textAnchor="middle" dominantBaseline="central" className={`${comfortaa.className} text-[7px] font-black fill-[#8B6914]`}>{qValues.top}</text>
          <text x="67.5" y="55.5" textAnchor="middle" dominantBaseline="central" className={`${comfortaa.className} text-[7px] font-black fill-[#8B6914]`}>{qValues.right}</text>
          <text x="50" y="73" textAnchor="middle" dominantBaseline="central" className={`${comfortaa.className} text-[7px] font-black fill-[#8B6914]`}>{qValues.bottom}</text>
          <text x="32.5" y="55.5" textAnchor="middle" dominantBaseline="central" className={`${comfortaa.className} text-[7px] font-black fill-[#8B6914]`}>{qValues.left}</text>

          <line x1="50" y1="55.5" x2="50" y2="38" stroke={mode === "work" ? "var(--primary)" : "#68D391"} strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${minuteRotation} 50 55.5)`} className="transition-transform duration-1000 ease-linear" />
          <line x1="50" y1="55.5" x2="50" y2="36" stroke="var(--tomato)" strokeWidth="0.5" strokeLinecap="round" transform={`rotate(${secondRotation} 50 55.5)`} className="transition-transform duration-1000 ease-linear" />

          <circle cx="50" cy="55.5" r="2" fill="#5C420D" />
          <circle cx="50" cy="55.5" r="0.8" fill="#8B6914" />
        </svg>
      </div>

      {/* Digital Countdown */}
      <div className={`mt-4 bg-white rounded-2xl border-2 ${mode === 'work' ? 'border-tomato/10' : 'border-green-100'} px-8 py-3 shadow-warm`}>
        <span className={`${comfortaa.className} text-5xl font-black ${mode === "work" ? "text-tomato" : "text-green-500"} tracking-tighter`}>
          {digitalTime}
        </span>
      </div>
    </div>
  );
}
