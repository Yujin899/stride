"use client";

import Link from "next/link";

interface HeaderProps {
  user: { name?: string; id?: string };
  streak: number;
}

export default function Header({ streak }: HeaderProps) {

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-[56px] bg-surface flex items-center justify-between px-4 z-40 bg-opacity-95 backdrop-blur-sm shadow-sm">
      <Link href="/home" className="flex items-center">
        <img src="/logo.png" alt="Stride" className="h-10 w-auto object-contain" />
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex gap-0.5" aria-label="Streak 🍅">
          {Array.from({ length: Math.min(streak, 5) }).map((_, i) => (
            <span key={i} className="text-sm">🍅</span>
          ))}
        </div>
        
        <img src="/tomato.png" alt="Profile" className="w-8 h-8 object-contain" />
      </div>
    </header>
  );
}
