/**
 * High-Performance AudioManager
 * Preloads sound effects to eliminate latency and ensure crisp feedback.
 */

class AudioManager {
  private static instance: AudioManager;
  private clickSound: HTMLAudioElement | null = null;
  private transitionSound: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.clickSound = new Audio("/sounds/click.mp3");
      this.clickSound.preload = "auto";
      
      // Secondary click for rapid-fire if needed, but resetting currentTime is usually enough
      this.transitionSound = new Audio("/sounds/click.mp3");
      this.transitionSound.preload = "auto";
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public playClick(): void {
    if (this.clickSound) {
      // Reset to start to allow rapid-fire clicks
      this.clickSound.currentTime = 0;
      this.clickSound.play().catch(() => {
        // Fallback or ignore if browser blocks auto-play
      });
    }
  }

  public playTransition(): void {
    // Just an alias for now, or could use a different sound later
    this.playClick();
  }
}

export const audioManager = typeof window !== "undefined" ? AudioManager.getInstance() : null;

export const playClick = () => {
  audioManager?.playClick();
};

export const playTransition = () => {
  audioManager?.playTransition();
};
