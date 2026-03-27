"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Square, CheckCircle2, Home, Coffee, BookOpen } from "lucide-react";
import { comfortaa } from "@/lib/fonts";
import { useRouter } from "next/navigation";
import TimerDisplay from "./TimerDisplay";
import { saveStudySession } from "@/lib/session-service";
import { useAuthStore } from "@/store/authStore";
import { useTimerStore } from "@/store/timerStore";
import { useImmersiveStore } from "@/lib/store";

interface PomodoroTimerProps {
  initialDuration?: number; // in minutes
  breakDuration?: number; // in minutes
  lectureId?: string;
  lectureTitle?: string;
  subjectName?: string;
  onComplete?: () => void;
}

export default function PomodoroTimer({ 
  initialDuration = 25,
  breakDuration = 5,
  lectureId, 
  lectureTitle,
  subjectName,
  onComplete 
}: PomodoroTimerProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Connect to Global Timer Store
  const { 
    mode, isRunning, timeLeft, totalSecondsStudied, targetEndTime,
    initialWorkDuration: storeWorkDur, initialBreakDuration: storeBreakDur,
    setMode, setDurations, start, pause, resume, reset, tick, addStudiedSecond, completeSession
  } = useTimerStore();

  const [isRinging, setIsRinging] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isManualEnd, setIsManualEnd] = useState(false);
  const { isTickEnabled, tickVolume } = useImmersiveStore();
  
  const audioAlarmRef = useRef<HTMLAudioElement | null>(null);
  const audioTickRef = useRef<HTMLAudioElement | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasRunningRef = useRef(false);

  // Tick Sound Sync
  useEffect(() => {
    if (audioTickRef.current) {
      audioTickRef.current.volume = tickVolume;
      if (isRunning && isTickEnabled && !isRinging) {
        // Use play() with catch to handle browser autoplay policies
        audioTickRef.current.play().catch(() => {
          // If autoplay fails, we just don't play. It will retry next state change.
        });
      } else {
        audioTickRef.current.pause();
      }
    }
  }, [isRunning, isTickEnabled, tickVolume, isRinging]);

  // Initialize durations in store
  useEffect(() => {
    setDurations(initialDuration, breakDuration);
  }, [initialDuration, breakDuration, setDurations]);

  // Audio & Notification setup
  useEffect(() => {
    audioAlarmRef.current = new Audio("/sounds/alaram.mp3");
    if (audioAlarmRef.current) {
      audioAlarmRef.current.loop = true;
      audioAlarmRef.current.preload = "auto";
      audioAlarmRef.current.volume = 1.0;
      console.log("Pomodoro: Alarm Audio Initialized");
    }

    audioTickRef.current = new Audio("/sounds/eight-ticks.mp3");
    if (audioTickRef.current) {
      audioTickRef.current.loop = true;
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (audioAlarmRef.current) {
        audioAlarmRef.current.pause();
        audioAlarmRef.current = null;
      }
      if (audioTickRef.current) {
        audioTickRef.current.pause();
        audioTickRef.current = null;
      }
    };
  }, []);

  // Global Tick Runner
  useEffect(() => {
    if (isRunning) {
      tickIntervalRef.current = setInterval(() => {
        tick();
        addStudiedSecond();
      }, 1000);
    } else {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    }
    return () => { if (tickIntervalRef.current) clearInterval(tickIntervalRef.current); };
  }, [isRunning, tick, addStudiedSecond]);

  // Sync on visibility change (re-entering tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [tick]);

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "/tomato.png", badge: "/tomato.png", tag: "pomodoro-alert" });
      } catch (err) { console.error("Notification failed:", err); }
    }
  };


  const saveStats = (seconds: number) => {
    try {
      const currentTotal = parseInt(localStorage.getItem("stride_study_total_seconds") || "0");
      localStorage.setItem("stride_study_total_seconds", (currentTotal + seconds).toString());
    } catch (e) { console.error("Stats save failed:", e); }
  };

  const persistSession = useCallback(async (seconds: number) => {
    if (!user?.id || seconds < 30) return; // Don't save sessions under 30s
    
    const minutes = Math.ceil(seconds / 60);
    saveStats(seconds);
    
    try {
      await saveStudySession({
        userId: user.id,
        durationMinutes: minutes,
        type: "work",
        xpEarned: Math.floor(minutes / 3),
        lectureId: lectureId,
        lectureTitle: lectureTitle || (lectureId ? `Lecture Session` : "General Study"),
        subjectName: subjectName || "The Woodland Scholar",
      });
    } catch (err) {
      console.error("History save failed:", err);
    }
  }, [user, lectureId, lectureTitle, subjectName]);

  const handleComplete = useCallback(async () => {
    const currentMode = mode;
    completeSession();
    setIsRinging(true);
    setSessionCompleted(true);
    setIsManualEnd(false);

    if (audioAlarmRef.current) {
      console.log("Pomodoro: Playing Alarm...");
      audioAlarmRef.current.currentTime = 0;
      audioAlarmRef.current.play()
        .then(() => console.log("Pomodoro: Alarm Playing Success"))
        .catch((err) => console.error("Pomodoro: Alarm Play Blocked:", err));
    }

    if (currentMode === "work") {
      const workMins = useTimerStore.getState().initialWorkDuration;
      persistSession(workMins * 60);
      sendNotification("Time's up, Scholar! 🍅", "Ready for a break?");
    } else {
      sendNotification("Break Over! 🌿", "Ready to start the next session?");
    }

    if (onComplete) onComplete();
  }, [mode, completeSession, persistSession, onComplete]);

  // Monitor timer end
  useEffect(() => {
    // If we just hit 0 and we WERE running, trigger handleComplete
    if (timeLeft === 0 && wasRunningRef.current && !sessionCompleted && !isManualEnd) {
      console.log("Pomodoro: Session Ended! Triggering completion...");
      Promise.resolve().then(() => {
        handleComplete();
      });
    }
    wasRunningRef.current = isRunning;
  }, [timeLeft, isRunning, sessionCompleted, isManualEnd, handleComplete]);

  const toggleTimer = () => {
    // Prime audio context on first user interaction
    if (audioAlarmRef.current && audioAlarmRef.current.paused) {
      console.log("Pomodoro: Priming Alarm Audio...");
      audioAlarmRef.current.play().then(() => {
        console.log("Pomodoro: Alarm Priming Success");
        if (!isRinging) {
          audioAlarmRef.current?.pause();
          audioAlarmRef.current!.currentTime = 0;
        }
      }).catch((err) => {
        console.warn("Pomodoro: Alarm Priming Failed (Expected if browser still blocks):", err);
      });
    }

    if (isRinging) {
      if (audioAlarmRef.current) {
        audioAlarmRef.current.pause();
        audioAlarmRef.current.currentTime = 0;
      }
      setIsRinging(false);
      return;
    }
    if (isRunning) {
      pause();
    } else {
      setSessionCompleted(false);
      if (targetEndTime) {
        resume();
      } else {
        start(mode === "work" ? storeWorkDur : storeBreakDur);
      }
    }
  };

  const resetTimer = () => {
    reset(storeWorkDur);
    setIsRinging(false);
    setSessionCompleted(false);
    if (audioAlarmRef.current) {
      audioAlarmRef.current.pause();
      audioAlarmRef.current.currentTime = 0;
    }
  };

  const endSessionEarly = () => {
    pause();
    if (mode === "work") {
      const elapsed = storeWorkDur * 60 - timeLeft;
      persistSession(elapsed);
    }
    setSessionCompleted(true);
    setIsManualEnd(true);
    if (audioAlarmRef.current) { audioAlarmRef.current.pause(); }
  };

  // Render Helpers
  const digitalTime = timeLeft >= 60 
    ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` 
    : `${timeLeft}s`;

  return (
    <div className="flex flex-col items-center gap-12 py-12 relative w-full max-w-md mx-auto">
      {/* 1. Timer Display Area */}
      <div className="relative">
        <TimerDisplay 
          mode={mode} 
          isRinging={isRinging} 
          digitalTime={digitalTime} 
        />

        {sessionCompleted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in duration-300 bg-[#FEFCF7]/95 backdrop-blur-md rounded-full">
            <div className="flex flex-col gap-3 w-52 scale-95">
              {lectureId ? (
                <button
                  onClick={() => router.push(`/quiz/${lectureId}`)}
                  className="bg-primary text-white px-5 py-4 rounded-2xl font-black shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all flex items-center justify-center gap-3 group"
                >
                  Go to Quiz <CheckCircle2 size={18} className="group-hover:rotate-12 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => router.push("/study")}
                  className="bg-primary text-white px-5 py-4 rounded-2xl font-black shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all flex items-center justify-center gap-3 group"
                >
                  Back to Library <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              )}

              {mode === "work" && !isManualEnd ? (
                <button
                  onClick={() => {
                    setMode("break");
                    start(storeBreakDur);
                    setSessionCompleted(false);
                    setIsRinging(false);
                    if (audioAlarmRef.current) { audioAlarmRef.current.pause(); audioAlarmRef.current.currentTime = 0; }
                  }}
                  className="bg-[#68D391] text-white px-5 py-4 rounded-xl font-black shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all flex items-center justify-center gap-3 group"
                >
                  Start Break 🌿 <Coffee size={18} className="group-hover:bounce transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    reset(storeWorkDur);
                    setMode("work");
                    start(storeWorkDur);
                    setSessionCompleted(false);
                    setIsRinging(false);
                    if (audioAlarmRef.current) { audioAlarmRef.current.pause(); audioAlarmRef.current.currentTime = 0; }
                  }}
                  className="bg-white text-primary border-2 border-primary/20 px-5 py-4 rounded-xl font-black shadow-sm hover:translate-y-[-2px] active:translate-y-px transition-all flex items-center justify-center gap-3 group"
                >
                  {isManualEnd ? "Another Session" : "New Session"} <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" />
                </button>
              )}

              <button
                onClick={() => router.push("/")}
                className="bg-white text-foreground border-2 border-[rgba(212,184,122,0.3)] px-5 py-4 rounded-xl font-black shadow-sm hover:translate-y-[-2px] active:translate-y-px transition-all flex items-center justify-center gap-3 group"
              >
                Go to Home <Home size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Controls & Inputs Area */}
      {!sessionCompleted && (
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Duration Inputs */}
          <div className={`grid grid-cols-2 gap-4 w-full px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200`}>
            {/* Study Input */}
            <div className="flex flex-col gap-2 p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm transition-all focus-within:border-tomato/30">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Study (min)</label>
              <input 
                type="number" 
                min="1" 
                max="120"
                disabled={isRunning || isRinging}
                value={storeWorkDur}
                onChange={(e) => setDurations(parseInt(e.target.value) || 1, storeBreakDur)}
                className="bg-transparent text-2xl font-black text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {/* Break Input */}
            <div className="flex flex-col gap-2 p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm transition-all focus-within:border-green-500/30">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Break (min)</label>
              <input 
                type="number" 
                min="1" 
                max="60"
                disabled={isRunning || isRinging}
                value={storeBreakDur}
                onChange={(e) => setDurations(storeWorkDur, parseInt(e.target.value) || 1)}
                className="bg-transparent text-2xl font-black text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Main Actions */}
          <div className="flex items-center gap-8">
            <button 
              onClick={resetTimer} 
              title="Reset"
              className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
            >
              <RotateCcw size={24} />
            </button>

            <div className="relative group">
              <button 
                onClick={toggleTimer} 
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 hover:scale-105 ${
                  isRunning ? "bg-slate-800 text-white shadow-slate-200" : "bg-primary text-white shadow-primary/20"
                }`}
              >
                {isRunning ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
              </button>
              {!isRunning && !isRinging && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                  Start Session
                </div>
              )}
            </div>

            <button 
              onClick={endSessionEarly} 
              disabled={!isRunning && !isRinging}
              className="w-16 h-16 bg-tomato/10 rounded-2xl flex items-center justify-center text-tomato hover:bg-tomato/20 transition-all active:scale-95 disabled:opacity-0 pointer-events-auto disabled:pointer-events-none"
            >
              <Square size={24} fill="currentColor" strokeWidth={0} />
            </button>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="opacity-50 hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
        <div className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
          Daily Stride Progress
        </div>
        <div className={`text-sm font-black text-slate-600 ${comfortaa.className}`}>
          {Math.floor(totalSecondsStudied / 60)}m {totalSecondsStudied % 60}s Studied Today
        </div>
      </div>
    </div>
  );
}
