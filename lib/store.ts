import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ImmersiveState {
  isAmbiancePlaying: boolean;
  ambianceVolume: number;
  isTickEnabled: boolean;
  tickVolume: number;
  isClickEnabled: boolean;
  clickVolume: number;
  setAmbiancePlaying: (playing: boolean) => void;
  setAmbianceVolume: (volume: number) => void;
  setTickEnabled: (enabled: boolean) => void;
  setTickVolume: (volume: number) => void;
  setClickEnabled: (enabled: boolean) => void;
  setClickVolume: (volume: number) => void;
}

export const useImmersiveStore = create<ImmersiveState>()(
  persist(
    (set) => ({
      isAmbiancePlaying: false,
      ambianceVolume: 0.5,
      isTickEnabled: true,
      tickVolume: 0.3,
      isClickEnabled: true,
      clickVolume: 0.4,
      setAmbiancePlaying: (playing) => set({ isAmbiancePlaying: playing }),
      setAmbianceVolume: (volume) => set({ ambianceVolume: volume }),
      setTickEnabled: (enabled) => set({ isTickEnabled: enabled }),
      setTickVolume: (volume) => set({ tickVolume: volume }),
      setClickEnabled: (enabled) => set({ isClickEnabled: enabled }),
      setClickVolume: (volume) => set({ clickVolume: volume }),
    }),
    {
      name: 'stride-immersive-storage',
    }
  )
);
