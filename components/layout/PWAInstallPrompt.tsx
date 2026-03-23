"use client";

import { useState, useEffect } from "react";
import { X, Share, ChevronRight, Smartphone } from "lucide-react";
import Image from "next/image";
import { Comfortaa } from "next/font/google";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone 
      || (typeof document !== 'undefined' && document.referrer.includes('android-app://'));

    if (isStandalone) return;

    // 2. Check dismissal
    const dismissedAt = localStorage.getItem("stride-pwa-dismissed");
    if (dismissedAt) {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < threeDays) return;
    }

    // 3. Detect Platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIOS || isAndroid || window.innerWidth < 1024;

    if (!isMobile) return;

    // 4. Listen for native install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      const installEvent = e as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Show for iOS manually since they don't support the event
    if (isIOS) {
      // Delay slightly for better UX
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    
    // Use a microtask to avoid "cascading render" warning in some linters
    Promise.resolve().then(() => {
      setPlatform(isIOS ? "ios" : isAndroid ? "android" : "other");
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("stride-pwa-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-[320px] z-100 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-[#FEFCF7]/90 backdrop-blur-xl border-2 border-primary/20 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
        {/* Scholar Decorative Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/50 via-primary to-primary/50" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 hover:bg-black/5 rounded-full transition-colors"
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2 border border-primary/10">
            <Image src="/tomato.png" alt="Stride" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h3 className={`${comfortaa.className} text-lg font-black text-primary`}>Stride Forge ⚒️</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Desktop Experience</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-[#7A6348] leading-relaxed mb-6">
          Install Stride to your home screen for a more focused, full-screen study environment.
        </p>

        {platform === "ios" ? (
          <div className="space-y-4">
            <div className="bg-white/50 rounded-2xl p-4 border border-primary/5 space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Share size={14} />
                </div>
                1. Tap the Share button below
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Smartphone size={14} />
                </div>
                2. Select &quot;Add to Home Screen&quot;
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Got it, Scholar! 🌿
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstall}
              className="flex-1 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Install Now 🚀 <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
