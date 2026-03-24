"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface HeaderProps {
  user: { name?: string; id?: string };
  streak: number;
}

export default function Header({ streak }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuthStore();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="lg:hidden relative h-[88px] bg-surface flex items-center justify-between px-6 z-50 border-b border-border/10 shadow-sm">
      <Link href="/home" className="flex items-center">
        <Image src="/logo.png" alt="Stride" width={160} height={56} className="h-14 w-auto object-contain" priority />
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex gap-0.5" aria-label="Streak 🍅">
          {Array.from({ length: Math.min(streak, 5) }).map((_, i) => (
            <span key={i} className="text-sm">🍅</span>
          ))}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center p-1 rounded-full hover:bg-black/5 active:scale-95 transition-all"
          >
            <img src="/tomato.png" alt="Profile" className="w-8 h-8 object-contain" />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-border/10 py-2 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-tomato hover:bg-tomato/5 transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
