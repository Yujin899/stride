"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Delete, Leaf } from "lucide-react";

export default function LoginForm() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      setPin((prev) => [...prev, num]);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (!name) {
      setError("Hero name required");
      return;
    }
    if (pin.length !== 4) {
      setError("Enter 4-digit PIN");
      return;
    }

    const pinString = pin.join("");
    const res = await login(name, pinString);
    if (res.success) {
      router.push("/home");
    } else {
      setError(res.error || "Login failed");
      setPin([]);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Welcome Heading */}
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-lg sm:text-xl font-display text-foreground flex items-center justify-center gap-2">
          Welcome back! <Leaf className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
        </h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium italic">
          Prepare for your next quest
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Name Input */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 font-display">
            Hero Name
          </label>
          <div className="relative group">
            <input
              type="text"
              placeholder="Your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full bg-surface-section rounded-[12px] px-4 sm:px-5 py-3 sm:py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-300 border-b-2 border-transparent focus:border-primary focus:shadow-warm"
            />
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 sm:gap-5 py-1 sm:py-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 transform ${
                pin.length > i 
                ? "bg-primary scale-110 shadow-sm" 
                : "bg-surface-section"
              }`}
            />
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isLoading}
              className="h-16 flex items-center justify-center text-lg sm:text-xl font-display bg-surface text-foreground rounded-[16px] hover:bg-surface-active transition-all duration-200 active:scale-95 shadow-sm tap-target"
            >
              {num}
            </button>
          ))}
          {/* Bottom Row */}
          <div className="h-16" />
          <button
            onClick={() => handleNumberClick(0)}
            disabled={isLoading}
            className="h-16 flex items-center justify-center text-lg sm:text-xl font-display bg-surface text-foreground rounded-[16px] hover:bg-surface-active transition-all duration-200 active:scale-95 shadow-sm tap-target"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={isLoading}
            className="h-16 flex items-center justify-center bg-surface text-tomato rounded-[16px] hover:bg-surface-active transition-all duration-200 active:scale-95 shadow-sm tap-target"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Action Area */}
      <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
        {error && (
          <p className="text-tomato text-[10px] sm:text-xs text-center font-bold animate-pulse bg-tomato/5 py-2 rounded-lg">
             {error}
          </p>
        )}
        
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !name || pin.length !== 4}
            className="btn-primary w-full py-3 sm:py-4 text-sm sm:text-base tracking-wider uppercase disabled:opacity-50 disabled:grayscale transition-all"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Let&apos;s Go! <img src="/tomato.png" alt="Tomato" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              </span>
            )}
          </button>

          <p className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground">
            New here? <Link href="/register" className="text-secondary hover:underline">Register your hero</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .tap-target {
          min-height: 44px;
        }
      `}</style>
    </div>
  );
}
