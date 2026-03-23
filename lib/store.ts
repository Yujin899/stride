import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ImmersiveState {
  isAmbiancePlaying: boolean;
  ambianceVolume: number;
  setAmbiancePlaying: (playing: boolean) => void;
  setAmbianceVolume: (volume: number) => void;
}

export const useImmersiveStore = create<ImmersiveState>()(
  persist(
    (set) => ({
      isAmbiancePlaying: false,
      ambianceVolume: 0.5,
      setAmbiancePlaying: (playing) => set({ isAmbiancePlaying: playing }),
      setAmbianceVolume: (volume) => set({ ambianceVolume: volume }),
    }),
    {
      name: 'stride-immersive-storage',
    }
  )
);
