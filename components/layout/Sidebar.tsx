"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  LogOut, 
  Home, 
  BookOpen, 
  AlertCircle, 
  ShieldCheck, 
  Flame,
  History
} from "lucide-react";
import { useImmersiveStore } from "@/lib/store";

interface SidebarProps {
  user: { name?: string; id?: string };
  role: string | null;
  streak: number;
}

export default function Sidebar({ user, role, streak }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const router = useRouter();
  const { 
    isAmbiancePlaying, setAmbiancePlaying, ambianceVolume, setAmbianceVolume,
    isTickEnabled, setTickEnabled, tickVolume, setTickVolume,
    isClickEnabled, setClickEnabled, clickVolume, setClickVolume
  } = useImmersiveStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLinks = [
    { name: "Home", href: "/home", image: "/home.png", icon: <Home size={20} /> },
    { name: "Study", href: "/study", image: "/study.png", icon: <BookOpen size={20} /> },
    { name: "Mistakes", href: "/mistakes", image: "/mistakes.png", icon: <AlertCircle size={20} /> },
    { name: "History", href: "/history", image: "/history.png", icon: <History size={20} /> },
    ...(role === "admin" ? [{ name: "Admin", href: "/admin", image: null, icon: <ShieldCheck size={20} /> }] : []),
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[240px] bg-surface flex-col z-40 shadow-sm transition-shadow overflow-y-auto scrollbar-hide">
      {/* Sidebar Header */}
      <div className="p-6">
        <Link href="/home" className="flex items-center px-1">
          <img src="/logo.png" alt="Stride" className="h-14 w-auto object-contain transition-transform hover:scale-105" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body font-semibold transition-all duration-200 group ${
                isActive
                  ? "bg-surface-active text-primary border-l-4 border-primary rounded-l-none"
                  : "text-foreground hover:bg-surface-section"
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {link.image ? (
                  <img 
                    src={link.image} 
                    alt="" 
                    className={`w-6 h-6 object-contain group-hover:scale-110 transition-transform ${isActive ? "" : "opacity-70 group-hover:opacity-100"}`} 
                  />
                ) : (
                  <div className="group-hover:scale-125 transition-transform duration-200">
                    {link.icon}
                  </div>
                )}
              </div>
              <span className="text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings Panel */}
      <div className="px-4 pb-2">
        <div className="wooden-panel p-4! space-y-4 rounded-2xl border border-[rgba(212,184,122,0.2)]">
          {/* Ambiance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <img src="/settings.png" alt="" className="w-3 h-3 object-contain opacity-50" />
                Ambiance 🌿
              </span>
              <button 
                onClick={() => setAmbiancePlaying(!isAmbiancePlaying)}
                className={`w-10 h-5 rounded-full relative transition-all ${isAmbiancePlaying ? 'bg-primary' : 'bg-[#EDE8DC]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isAmbiancePlaying ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-muted-foreground opacity-60">
                <span>Volume {Math.round(ambianceVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={ambianceVolume}
                onChange={(e) => setAmbianceVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#EDE8DC] rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className="h-px bg-primary/5 mx-2" />

          {/* Clock Ticks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Clock Ticks 🕰️
              </span>
              <button 
                onClick={() => setTickEnabled(!isTickEnabled)}
                className={`w-10 h-5 rounded-full relative transition-all ${isTickEnabled ? 'bg-primary' : 'bg-[#EDE8DC]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isTickEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-muted-foreground opacity-60">
                <span>Tick Volume {Math.round(tickVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={tickVolume}
                onChange={(e) => setTickVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#EDE8DC] rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className="h-px bg-primary/5 mx-2" />

          {/* Click Sounds */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Click Sounds 🖱️
              </span>
              <button 
                onClick={() => setClickEnabled(!isClickEnabled)}
                className={`w-10 h-5 rounded-full relative transition-all ${isClickEnabled ? 'bg-primary' : 'bg-[#EDE8DC]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isClickEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-muted-foreground opacity-60">
                <span>Click Volume {Math.round(clickVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={clickVolume}
                onChange={(e) => setClickVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#EDE8DC] rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Panel */}
      <div className="p-4 mt-auto">
        <div className="wooden-panel p-4! space-y-3 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
              Scholar
            </p>
            <p className="text-sm font-bold text-foreground truncate">
              {user?.name || "Ready Player One"}
            </p>
          </div>
          
          <div className="flex gap-1 items-center" aria-label="Streak">
            {Array.from({ length: Math.min(streak, 5) }).map((_, i) => (
              <Flame 
                key={i} 
                size={16} 
                className="text-orange-500 fill-orange-500 animate-in fade-in slide-in-from-bottom-1" 
                style={{ animationDelay: `${i * 100}ms` }} 
              />
            ))}
            {streak > 5 && <span className="text-xs font-black text-orange-600 ml-1">+{streak - 5}</span>}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-tomato transition-colors w-full pt-2 border-t border-surface-section"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
