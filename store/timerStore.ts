import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionMode = "work" | "break" | "completed";

interface TimerState {
  // Config
  initialWorkDuration: number;
  initialBreakDuration: number;
  
  // State
  mode: SessionMode;
  isRunning: boolean;
  timeLeft: number; // in seconds
  totalSecondsStudied: number;
  targetEndTime: number | null; // Timestamp
  
  // Actions
  setMode: (mode: SessionMode) => void;
  setDurations: (work: number, breakMins: number) => void;
  start: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  reset: (minutes?: number) => void;
  tick: () => void;
  addStudiedSecond: () => void;
  completeSession: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Default Config
      initialWorkDuration: 25,
      initialBreakDuration: 5,
      
      // Initial State
      mode: "work",
      isRunning: false,
      timeLeft: 25 * 60,
      totalSecondsStudied: 0,
      targetEndTime: null,

      setMode: (mode) => set({ mode }),

      setDurations: (work, breakMins) => {
        set({ initialWorkDuration: work, initialBreakDuration: breakMins });
        if (!get().isRunning && get().mode === "work") {
          set({ timeLeft: work * 60 });
        }
      },

      start: (minutes) => {
        const endTime = Date.now() + minutes * 60 * 1000;
        set({ 
          isRunning: true, 
          targetEndTime: endTime, 
          timeLeft: minutes * 60 
        });
      },

      pause: () => {
        set({ isRunning: false, targetEndTime: null });
      },

      resume: () => {
        const { timeLeft } = get();
        const endTime = Date.now() + timeLeft * 1000;
        set({ isRunning: true, targetEndTime: endTime });
      },

      reset: (minutes) => {
        const m = minutes || get().initialWorkDuration;
        set({ 
          isRunning: false, 
          targetEndTime: null, 
          mode: "work", 
          timeLeft: m * 60 
        });
      },

      tick: () => {
        const { isRunning, targetEndTime, timeLeft } = get();
        if (!isRunning || !targetEndTime) return;

        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
        
        if (remaining !== timeLeft) {
          set({ timeLeft: remaining });
          if (remaining === 0) {
            set({ isRunning: false, targetEndTime: null });
          }
        }
      },

      addStudiedSecond: () => {
        if (get().mode === "work" && get().isRunning) {
          set((state) => ({ totalSecondsStudied: state.totalSecondsStudied + 1 }));
        }
      },

      completeSession: () => {
        set({ isRunning: false, targetEndTime: null });
      }
    }),
    {
      name: "stride-timer-storage",
      // Only persist essential state
      partialize: (state) => ({
        mode: state.mode,
        isRunning: state.isRunning,
        timeLeft: state.timeLeft,
        targetEndTime: state.targetEndTime,
        totalSecondsStudied: state.totalSecondsStudied,
        initialWorkDuration: state.initialWorkDuration,
        initialBreakDuration: state.initialBreakDuration,
      }),
    }
  )
);
