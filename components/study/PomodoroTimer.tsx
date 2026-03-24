"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Minus, Square, CheckCircle2, Home, Coffee } from "lucide-react";
import { comfortaa, nunito } from "@/lib/fonts";
import { useRouter } from "next/navigation";
import TimerDisplay from "./TimerDisplay";
import { saveStudySession } from "@/lib/weekplan-service";
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
    reset(initialDuration);
    setIsRinging(false);
    setSessionCompleted(false);
    if (audioAlarmRef.current) {
      audioAlarmRef.current.pause();
      audioAlarmRef.current.currentTime = 0;
    }
  };

  const endSessionEarly = () => {
    const currentMode = useTimerStore.getState().mode;
    const currentWorkMins = useTimerStore.getState().initialWorkDuration;
    
    pause();
    if (currentMode === "work") {
      const elapsed = currentWorkMins * 60 - timeLeft;
      persistSession(elapsed);
    }
    setSessionCompleted(true);
    setIsManualEnd(true);
    if (audioAlarmRef.current) { audioAlarmRef.current.pause(); }
  };

  const adjustDuration = (amount: number) => {
    if (isRunning || isRinging || mode !== "work") return;
    const newDur = Math.max(1, Math.min(120, storeWorkDur + amount));
    setDurations(newDur, storeBreakDur);
  };

  // Render Helpers
  const currentInitialDuration = mode === "work" ? storeWorkDur : storeBreakDur;
  const totalElapsed = currentInitialDuration * 60 - timeLeft;
  const currentTotal = currentInitialDuration * 60;
  
  const minuteRotation = (totalElapsed / currentTotal) * 360;
  const secondRotation = totalElapsed * 6;
  const digitalTime = timeLeft >= 60 ? Math.floor(timeLeft / 60) : `${timeLeft}s`;
  
  const qValues = {
    top: 0,
    right: Math.round(currentInitialDuration / 4),
    bottom: Math.round(currentInitialDuration / 2),
    left: Math.round(currentInitialDuration * 3 / 4)
  };

  return (
    <div className="flex flex-col items-center gap-10 py-10 relative">
      <div className="relative">
        <TimerDisplay 
          mode={mode} 
          isRinging={isRinging} 
          minuteRotation={minuteRotation} 
          secondRotation={secondRotation} 
          digitalTime={digitalTime} 
          qValues={qValues} 
        />

        {sessionCompleted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in duration-300 bg-[#FEFCF7]/95 backdrop-blur-md rounded-full">
            <div className="flex flex-col gap-3 w-52 scale-90">
              {/* Button 1: Go to Quiz */}
              <button
                onClick={() => router.push(`/quiz/${lectureId || "latest"}`)}
                className="bg-primary text-white px-5 py-4 rounded-2xl font-black shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all flex items-center justify-center gap-3 group"
              >
                Go to Quiz <CheckCircle2 size={18} className="group-hover:rotate-12 transition-transform" />
              </button>

              {/* Button 2: Dynamic Middle Button */}
              {mode === "work" && !isManualEnd ? (
                <button
                  onClick={() => {
                    setMode("break");
                    start(breakDuration);
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
                    reset(initialDuration);
                    setMode("work");
                    start(initialDuration);
                    setSessionCompleted(false);
                    setIsRinging(false);
                    if (audioAlarmRef.current) { audioAlarmRef.current.pause(); audioAlarmRef.current.currentTime = 0; }
                  }}
                  className="bg-white text-primary border-2 border-primary/20 px-5 py-4 rounded-xl font-black shadow-sm hover:translate-y-[-2px] active:translate-y-px transition-all flex items-center justify-center gap-3 group"
                >
                  {isManualEnd ? "Another Session" : "New Session"} <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" />
                </button>
              )}

              {/* Button 3: Go to Home */}
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

      {!sessionCompleted && mode !== "completed" && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <button 
              onClick={() => adjustDuration(-5)} 
              disabled={isRunning || isRinging || mode !== "work"} 
              className="w-12 h-12 bg-[#EDE8DC] rounded-xl flex items-center justify-center text-foreground border-2 border-[rgba(212,184,122,0.3)] hover:bg-[#FEFCF7] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
            >
              <Minus size={22} />
            </button>
            
            <div className="flex flex-col items-center min-w-[120px]">
              <span className={`${nunito.className} text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 opacity-70`}>
                {mode === "work" ? "Study Session" : "Refresh Break"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`${comfortaa.className} text-2xl font-black text-primary`}>
                  {currentInitialDuration}
                </span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">min</span>
              </div>
            </div>

            <button 
              onClick={() => adjustDuration(5)} 
              disabled={isRunning || isRinging || mode !== "work"} 
              className="w-12 h-12 bg-[#EDE8DC] rounded-xl flex items-center justify-center text-foreground border-2 border-[rgba(212,184,122,0.3)] hover:bg-[#FEFCF7] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
            >
              <Plus size={22} />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={resetTimer} className="w-14 h-14 bg-[#EDE8DC] rounded-2xl flex items-center justify-center text-foreground border-2 border-[rgba(212,184,122,0.3)] transition-all shadow-sm"><RotateCcw size={22} /></button>
            <button onClick={toggleTimer} className="w-20 h-20 bg-primary text-white rounded-4xl flex items-center justify-center shadow-[0_8px_0_#5C420D] hover:translate-y-0.5 transition-all">{isRunning ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}</button>
            <button onClick={endSessionEarly} className="w-14 h-14 bg-[#EDE8DC] rounded-2xl flex items-center justify-center text-tomato border-2 border-[rgba(212,184,122,0.3)] transition-all shadow-sm"><Square size={22} fill="currentColor" strokeWidth={0} /></button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs font-bold text-muted-foreground tracking-widest uppercase">
        Total Studied: {Math.floor(totalSecondsStudied / 60)}m {totalSecondsStudied % 60}s
      </div>
    </div>
  );
}
