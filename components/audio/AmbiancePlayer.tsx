"use client";

import { useEffect, useRef, useState } from "react";
import { useImmersiveStore } from "@/lib/store";

export default function AmbiancePlayer() {
  const { isAmbiancePlaying, ambianceVolume } = useImmersiveStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and Unlock Audio
  useEffect(() => {
    const audio = new Audio("/sounds/background.mp3");
    audio.loop = true;
    audio.volume = 0; // Start at 0 for fade-in
    audioRef.current = audio;

    const unlock = () => {
      audio.play().then(() => {
        setIsUnlocked(true);
        if (!isAmbiancePlaying) audio.pause();
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
      }).catch(() => {
        // Still blocked, wait for next interaction
      });
    };

    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isAmbiancePlaying]);

  // Handle Play/Pause and Fades
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isUnlocked) return;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const targetVolume = isAmbiancePlaying ? ambianceVolume : 0;
    const step = 0.05;
    const interval = 50; // ms

    if (isAmbiancePlaying && audio.paused) {
      audio.play().catch(console.warn);
    }

    fadeIntervalRef.current = setInterval(() => {
      const currentVol = audio.volume;
      if (Math.abs(currentVol - targetVolume) < step) {
        audio.volume = targetVolume;
        if (targetVolume === 0) audio.pause();
        clearInterval(fadeIntervalRef.current!);
      } else {
        audio.volume = currentVol + (targetVolume > currentVol ? step : -step);
      }
    }, interval);

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [isAmbiancePlaying, isUnlocked, ambianceVolume]);

  return null;
}
