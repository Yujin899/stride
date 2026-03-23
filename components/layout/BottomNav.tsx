"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  BookOpen, 
  AlertCircle, 
  ShieldCheck,
  History
} from "lucide-react";
import { useState } from "react";
import { useImmersiveStore } from "@/lib/store";

interface BottomNavProps {
  role: string | null;
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const { isAmbiancePlaying, setAmbiancePlaying, ambianceVolume, setAmbianceVolume } = useImmersiveStore();

  const navLinks = [
    { name: "Home", href: "/home", image: "/home.png", icon: <Home size={20} /> },
    { name: "Study", href: "/study", image: "/study.png", icon: <BookOpen size={20} /> },
    { name: "Mistakes", href: "/mistakes", image: "/mistakes.png", icon: <AlertCircle size={20} /> },
    { name: "History", href: "/history", image: "/history.png", icon: <History size={20} /> },
    ...(role === "admin" ? [{ name: "Admin", href: "/admin/upload", image: null, icon: <ShieldCheck size={20} /> }] : []),
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-surface flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 min-w-[56px] transition-all duration-200 ${
              isActive 
                ? "bg-surface-active rounded-xl py-2 px-2 text-primary scale-110 shadow-sm" 
                : "text-muted-foreground"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {link.image ? (
                <img 
                  src={link.image} 
                  alt="" 
                  className={`w-5 h-5 object-contain transition-all ${isActive ? "" : "opacity-60 saturate-0"}`} 
                />
              ) : (
                <div className="flex items-center justify-center">
                  {link.icon}
                </div>
              )}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">
              {link.name}
            </span>
          </Link>
        );
      })}

      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`flex flex-col items-center gap-1 min-w-[56px] transition-all duration-200 ${
          showSettings ? "text-primary scale-110" : "text-muted-foreground"
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <img 
            src="/settings.png" 
            alt="" 
            className={`w-5 h-5 object-contain transition-all ${showSettings ? "" : "opacity-60 saturate-0"}`} 
          />
        </div>
        <span className="text-[9px] font-black uppercase tracking-tighter">
          Setup
        </span>
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
