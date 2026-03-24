"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
} from "lucide-react";
import { useState } from "react";
import { useImmersiveStore } from "@/lib/store";

export default function BottomNav() {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const { isAmbiancePlaying, setAmbiancePlaying, ambianceVolume, setAmbianceVolume } = useImmersiveStore();

  const navLinks = [
    { name: "Home", href: "/home", icon: "/home.png" },
    { name: "Study", href: "/study", icon: "/study.png" },
    { name: "Mistakes", href: "/mistakes", icon: "/mistakes.png" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-primary/5 flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-all duration-300">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
              isActive 
                ? "bg-primary/10 scale-110" 
                : "opacity-40 grayscale"
            }`}
          >
            <img src={link.icon} alt={link.name} className="w-7 h-7 object-contain" />
          </Link>
        );
      })}

      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
          showSettings 
            ? "bg-secondary/10 scale-110" 
            : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
        }`}
      >
        <img src="/settings.png" alt="Setup" className="w-7 h-7 object-contain" />
      </button>

      {/* Mobile Settings Overlay */}
      {showSettings && (
        <div className="absolute bottom-[80px] left-4 right-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="wooden-panel p-5! space-y-5 rounded-[2rem] shadow-2xl border-4 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Ambiance 🌿
              </span>
              <button 
                onClick={() => setAmbiancePlaying(!isAmbiancePlaying)}
                className={`w-12 h-6 rounded-full relative transition-all ${isAmbiancePlaying ? 'bg-primary' : 'bg-[#EDE8DC]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAmbiancePlaying ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                <span>Volume</span>
                <span>{Math.round(ambianceVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={ambianceVolume}
                onChange={(e) => setAmbianceVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#EDE8DC] rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
          {/* Overlay closer backdrop */}
          <div 
            className="fixed inset-0 -z-10" 
            onClick={() => setShowSettings(false)}
          />
        </div>
      )}
    </nav>
  );
}
