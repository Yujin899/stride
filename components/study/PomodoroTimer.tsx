import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Minus, Square, CheckCircle2, Home } from "lucide-react";
import { Comfortaa, Nunito } from "next/font/google";
import { useRouter } from "next/navigation";
import TimerDisplay from "./TimerDisplay";
import { saveStudySession } from "@/lib/weekplan-service";
import { useAuthStore } from "@/store/authStore";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "800"] });

type SessionMode = "work" | "break" | "completed";

interface PomodoroTimerProps {
  initialDuration?: number; // in minutes
  breakDuration?: number; // in minutes
  lectureId?: string;
  lectureTitle?: string;
  subjectName?: string;
  onComplete?: () => void;
}

export default function PomodoroTimer({ 
  breakDuration = 5,
  lectureId, 
  lectureTitle,
  subjectName,
  onComplete 
}: PomodoroTimerProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [mode, setMode] = useState<SessionMode>("work");
  const [duration, setDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
  const [totalSecondsStudied, setTotalSecondsStudied] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioAlarmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio & Notifications
  useEffect(() => {
    audioAlarmRef.current = new Audio("/sounds/alaram.mp3");
    if (audioAlarmRef.current) {
      audioAlarmRef.current.loop = true;
      const handleTimeUpdate = () => {
        if (audioAlarmRef.current && audioAlarmRef.current.currentTime >= 3) {
          audioAlarmRef.current.currentTime = 0;
        }
      };
      audioAlarmRef.current.addEventListener("timeupdate", handleTimeUpdate);
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (audioAlarmRef.current) {
        audioAlarmRef.current.pause();
        audioAlarmRef.current = null;
      }
    };
  }, []);

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "/tomato.png", badge: "/tomato.png", tag: "pomodoro-alert" });
      } catch (err) { console.error("Notification failed:", err); }
    }
  };

  const playClick = () => { new Audio("/sounds/click.mp3").play().catch(() => {}); };

  const saveStats = (seconds: number) => {
    try {
      const currentTotal = parseInt(localStorage.getItem("stride_study_total_seconds") || "0");
      localStorage.setItem("stride_study_total_seconds", (currentTotal + seconds).toString());
    } catch (e) { console.error("Stats save failed:", e); }
  };

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    setIsRinging(true);

    if (audioAlarmRef.current) {
      audioAlarmRef.current.currentTime = 0;
      audioAlarmRef.current.play().catch(() => { });
    }

    if (mode === "work") {
      saveStats(duration * 60);
      setTotalSecondsStudied(prev => prev + (duration * 60));
      
      // Save Session to Firestore Journal
      if (user?.id) {
        saveStudySession({
          userId: user.id,
          durationMinutes: duration,
          type: "work",
          xpEarned: Math.floor(duration / 3),
          lectureId: lectureId,
          lectureTitle: lectureTitle || (lectureId ? `Lecture Session` : "General Study"),
          subjectName: subjectName || "The Woodland Scholar",
        }).catch(err => console.error("History save failed:", err));
      }

      setShowBreakPrompt(true);
      sendNotification("Time's up, Scholar! 🍅", "Ready for a break?");
    } else {
      setMode("completed");
      sendNotification("Break Over! 🌿", "Ready to start the next session?");
    }

    if (onComplete) onComplete();
  }, [mode, duration, onComplete, user, lectureId, lectureTitle, subjectName]);

  // Timer Logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (mode === "work") setTotalSecondsStudied(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft, mode]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      // Use microtask to avoid cascading render warning
      Promise.resolve().then(() => {
        handleComplete();
      });
      return;
    }
  }, [timeLeft, isRunning, handleComplete]);


  const toggleTimer = () => {
    if (isRinging) {
      if (audioAlarmRef.current) {
        audioAlarmRef.current.pause();
        audioAlarmRef.current.currentTime = 0;
      }
      setIsRinging(false);
      setShowBreakPrompt(false);
      return;
    }
    playClick();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsRinging(false);
    setMode("work");
    setTimeLeft(duration * 60);
    playClick();
    if (audioAlarmRef.current) {
      audioAlarmRef.current.pause();
      audioAlarmRef.current.currentTime = 0;
    }
  };

  const endSession = () => {
    setIsRunning(false);
    setMode("completed");
    if (mode === "work") {
      const elapsed = (duration * 60) - timeLeft;
      saveStats(elapsed);
      setTotalSecondsStudied(prev => prev + elapsed);
    }
    if (audioAlarmRef.current) { audioAlarmRef.current.pause(); }
    setShowBreakPrompt(false);
  };

  const adjustDuration = (amount: number) => {
    if (isRunning || isRinging) return;
    playClick();
    setDuration(prev => {
      const next = Math.max(1, Math.min(120, prev + amount));
      setTimeLeft(next * 60);
      return next;
    });
  };

  // Render Helpers
  const totalElapsed = (mode === "work" ? duration * 60 : breakDuration * 60) - timeLeft;
  const currentTotal = (mode === "work" ? duration * 60 : breakDuration * 60);
  const minuteRotation = (totalElapsed / currentTotal) * 360;
  const secondRotation = totalElapsed * 6;
  const digitalTime = timeLeft >= 60 ? Math.floor(timeLeft / 60) : `${timeLeft}s`;
  const activeDuration = mode === "work" ? duration : breakDuration;
  const qValues = {
    top: 0,
    right: Math.round(activeDuration / 4),
    bottom: Math.round(activeDuration / 2),
    left: Math.round(activeDuration * 3 / 4)
  };

  return (
    <div className="flex flex-col items-center gap-10 py-10 relative">
      <div className="relative">
        <TimerDisplay 
          mode={mode} 
          duration={duration} 
          timeLeft={timeLeft} 
          isRinging={isRinging} 
          minuteRotation={minuteRotation} 
          secondRotation={secondRotation} 
          digitalTime={digitalTime} 
          qValues={qValues} 
        />
        

        {mode === "completed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in duration-300 bg-[#FEFCF7]/90 backdrop-blur-sm rounded-full">
            <div className="flex flex-col gap-4 w-48 scale-90">
              <button
                onClick={() => router.push(`/quiz/${lectureId || "latest"}`)}
                className="bg-primary text-white px-6 py-3 rounded-full font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Go to Quiz <CheckCircle2 size={20} />
              </button>
              <button
                onClick={() => router.push("/home")}
                className="bg-white text-(--text) border-2 border-[rgba(212,184,122,0.3)] px-6 py-3 rounded-full font-black shadow-sm hover:bg-[#FEFCF7] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Go to Home <Home size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showBreakPrompt && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#FEFCF7] p-8 rounded-[2.5rem] shadow-2xl border-4 border-primary/20 max-w-xs w-full text-center animate-in zoom-in-95 duration-300">
            <div className="mb-6">
              <h3 className={`${comfortaa.className} text-2xl font-black text-primary`}>Break Time! 🌿</h3>
              <p className="text-sm font-bold text-muted-foreground mt-2">Ready to keep flowing?</p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setMode("break");
                  setTimeLeft(breakDuration * 60);
                  setIsRinging(false);
                  setShowBreakPrompt(false);
                  if (audioAlarmRef.current) { audioAlarmRef.current.pause(); audioAlarmRef.current.currentTime = 0; }
                  setIsRunning(true);
                }}
                className="bg-primary text-white py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Start Break 🌿
              </button>
              <button
                onClick={() => { saveStats(duration * 60); router.push(`/quiz/${lectureId || "latest"}`); }}
                className="bg-white text-tomato border-2 border-tomato/20 py-4 rounded-2xl font-black shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                End & Quiz 🎯
              </button>
            </div>
          </div>
        </div>
      )}

      {mode !== "completed" && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <button 
              onClick={() => adjustDuration(-5)} 
              disabled={isRunning || isRinging || mode !== "work"} 
              className="w-12 h-12 bg-[#EDE8DC] rounded-xl flex items-center justify-center text-(--text) border-2 border-[rgba(212,184,122,0.3)] hover:bg-[#FEFCF7] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
            >
              <Minus size={22} />
            </button>
            
            <div className="flex flex-col items-center min-w-[120px]">
              <span className={`${nunito.className} text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 opacity-70`}>
                {mode === "work" ? "Study Session" : "Refresh Break"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`${comfortaa.className} text-2xl font-black text-primary`}>
                  {mode === "work" ? duration : 5}
                </span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">min</span>
              </div>
            </div>

            <button 
              onClick={() => adjustDuration(5)} 
              disabled={isRunning || isRinging || mode !== "work"} 
              className="w-12 h-12 bg-[#EDE8DC] rounded-xl flex items-center justify-center text-(--text) border-2 border-[rgba(212,184,122,0.3)] hover:bg-[#FEFCF7] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
            >
              <Plus size={22} />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={resetTimer} className="w-14 h-14 bg-[#EDE8DC] rounded-2xl flex items-center justify-center text-(--text) border-2 border-[rgba(212,184,122,0.3)] transition-all shadow-sm"><RotateCcw size={22} /></button>
            <button onClick={toggleTimer} className="w-20 h-20 bg-[var(--primary)] text-white rounded-[2rem] flex items-center justify-center shadow-[0_8px_0_#5C420D] hover:translate-y-0.5 transition-all">{isRunning ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}</button>
            <button onClick={endSession} className="w-14 h-14 bg-[#EDE8DC] rounded-2xl flex items-center justify-center text-[var(--tomato)] border-2 border-[rgba(212,184,122,0.3)] transition-all shadow-sm"><Square size={22} fill="currentColor" strokeWidth={0} /></button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs font-bold text-muted-foreground tracking-widest uppercase">
        Total Studied: {Math.floor(totalSecondsStudied / 60)}m {totalSecondsStudied % 60}s
      </div>
    </div>
  );
}
