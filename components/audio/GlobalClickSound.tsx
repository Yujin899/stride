"use client";

import { useCallback, useEffect, useRef } from "react";
import { useImmersiveStore } from "@/lib/store";

export default function GlobalClickSound() {
  const { isClickEnabled, clickVolume } = useImmersiveStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Initialize Web Audio API for low-latency playback
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        audioContextRef.current = new AudioContextClass();
        
        const response = await fetch("/sounds/click.mp3");
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (err) {
        // Silently fail if click sound fails to load
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playSound = useCallback(async () => {
    if (!isClickEnabled || !audioContextRef.current || !audioBufferRef.current) return;

    try {
      // Resume context if suspended (needed for browser autoplay policies)
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();

      source.buffer = audioBufferRef.current;
      gainNode.gain.value = clickVolume;

      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.start(0);
    } catch (err) {
      // Catch playback errors silently
    }
  }, [isClickEnabled, clickVolume]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Look for button, link, or elements with role="button"
      const interactiveElement = target.closest('button, a, [role="button"]');
      
      if (interactiveElement) {
        playSound();
      }
    };

    window.addEventListener("mousedown", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("mousedown", handleGlobalClick, { capture: true });
  }, [playSound]);

  return null;
}
