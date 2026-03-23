import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ImmersiveState {
  isAmbiancePlaying: boolean;
  ambianceVolume: number;
  isTimerFloating: boolean;
  setAmbiancePlaying: (playing: boolean) => void;
  setAmbianceVolume: (volume: number) => void;
  setTimerFloating: (floating: boolean) => void;
}

export const useImmersiveStore = create<ImmersiveState>()(
  persist(
    (set) => ({
      isAmbiancePlaying: false,
      ambianceVolume: 0.5,
      isTimerFloating: false,
      setAmbiancePlaying: (playing) => set({ isAmbiancePlaying: playing }),
      setAmbianceVolume: (volume) => set({ ambianceVolume: volume }),
      setTimerFloating: (floating) => set({ isTimerFloating: floating }),
    }),
    {
      name: 'stride-immersive-storage',
    }
  )
);
