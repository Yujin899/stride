"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import BotController from "@/components/admin/BotController";
import { ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { comfortaa, nunito } from "@/lib/fonts";
import Link from "next/link";

export default function OracleManagement() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/home");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Invoking the Oracle...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-12 pb-20 ${nunito.className}`}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">
        <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight size={10} className="opacity-30" />
        <span className="text-primary/60">Oracle Bot</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-linear-to-br from-secondary to-purple-700 text-white flex items-center justify-center">
                <Zap size={24} />
             </div>
             <h1 className={`${comfortaa.className} text-4xl text-foreground font-black tracking-tight`}>
                Oracle Bot 🔮
             </h1>
          </div>
          <p className="text-muted-foreground font-medium italic pl-13">Automating wisdom delivery to the Stride disciples.</p>
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 text-secondary text-xs font-black uppercase tracking-widest">
           <ShieldCheck size={14} />
           Smart Automation
        </div>
      </div>

      <div className="wooden-panel border-secondary/10">
        <BotController />
      </div>

      <section className="bg-surface-section rounded-3xl p-8 border border-border/50">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground">About the Oracle</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Oracle Bot uses <b>Smart Timing</b> to ensure polls are sent only when students are active. 
          When <b>Auto-Pilot</b> is enabled, a GitHub Heartbeat triggers every 30 minutes to check if the 
          configured interval (e.g., 2 hours) has passed since the last poll.
        </p>
      </section>
    </div>
  );
}
