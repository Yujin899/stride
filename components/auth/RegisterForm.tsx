"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Delete, Sprout } from "lucide-react";

import { playClick } from "@/lib/audio";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState<number[]>([]);
  const [confirmPin, setConfirmPin] = useState<number[]>([]);
  const [activeField, setActiveField] = useState<"pin" | "confirmPin">("pin");
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleNumberClick = (num: number) => {
    playClick();
    if (activeField === "pin") {
      if (pin.length < 4) {
        const nextPin = [...pin, num];
        setPin(nextPin);
        setError(null);
        if (nextPin.length === 4) {
          setActiveField("confirmPin");
        }
      }
    } else {
      if (confirmPin.length < 4) {
        setConfirmPin((prev) => [...prev, num]);
        setError(null);
      }
    }
  };

  const handleBackspace = () => {
    playClick();
    if (activeField === "confirmPin") {
      if (confirmPin.length > 0) {
        setConfirmPin((prev) => prev.slice(0, -1));
      } else {
        setActiveField("pin");
      }
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    playClick();
    if (name.length < 2) {
      setError("Hero name must be at least 2 characters");
      return;
    }
    if (pin.length !== 4) {
      setError("Please set a 4-digit PIN");
      return;
    }
    if (confirmPin.length !== 4) {
      setError("Please confirm your PIN");
      return;
    }
    if (pin.join("") !== confirmPin.join("")) {
      setError("PINs do not match");
      setConfirmPin([]);
      return;
    }

    const pinString = pin.join("");
    const res = await register(name, pinString);
    if (res.success) {
      router.push("/login?registered=true");
    } else {
      setError(res.error || "Registration failed");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Welcome Heading */}
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-lg sm:text-xl font-display text-foreground flex items-center justify-center gap-2">
          Begin Your Journey <Sprout className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
        </h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium italic">
          Forge your dental scholar identity
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Name Input */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 font-display">
            Full Name
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

        {/* PIN Entry Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* PIN */}
          <div className={`space-y-2 px-2 py-3 rounded-xl transition-all duration-300 ${activeField === 'pin' ? 'bg-surface-active shadow-inner scale-[1.02]' : 'opacity-60'}`} 
               onClick={() => setActiveField('pin')}>
            <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center block font-display">
              Set PIN
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    pin.length > i 
                    ? "bg-primary shadow-sm" 
                    : "bg-surface-section"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Confirm PIN */}
          <div className={`space-y-2 px-2 py-3 rounded-xl transition-all duration-300 ${activeField === 'confirmPin' ? 'bg-surface-active shadow-inner scale-[1.02]' : 'opacity-60'}`}
               onClick={() => setActiveField('confirmPin')}>
            <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center block font-display">
              Confirm PIN
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    confirmPin.length > i 
                    ? "bg-primary shadow-sm" 
                    : "bg-surface-section"
                  }`}
                />
              ))}
            </div>
          </div>
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
            disabled={isLoading || !name || pin.length !== 4 || confirmPin.length !== 4}
            className="btn-primary w-full py-3 sm:py-4 text-sm sm:text-base tracking-wider uppercase disabled:opacity-50 disabled:grayscale transition-all"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Create Account <img src="/tomato.png" alt="Tomato" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              </span>
            )}
          </button>

          <p className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground">
            Already a scholar? <Link href="/login" className="text-secondary hover:underline">Sign in</Link>
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
