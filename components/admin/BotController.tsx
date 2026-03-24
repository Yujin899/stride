"use client";

import { useEffect, useState } from "react";
import { fetchAllSubjects } from "@/lib/admin-service";
import { BotConfig, Subject } from "@/types";
import { Loader2, Send, Settings, Save, Sparkles, MessageSquare } from "lucide-react";

export default function BotController() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [confRes, subs] = await Promise.all([
          fetch("/api/bot/config"),
          fetchAllSubjects()
        ]);
        const conf = await confRes.json();
        setConfig(conf || { id: "current", subjectId: "random", chatId: "" });
        setSubjects(subs);
      } catch (err) {
        console.error("Bot init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setStatus({ type: "success", msg: "Configuration saved to the realm!" });
      } else {
        throw new Error("Save failed");
      }
    } catch {
      setStatus({ type: "error", msg: "Failed to update the scribes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrigger = async () => {
    if (!config?.chatId) {
      setStatus({ type: "error", msg: "Enter a Chat ID first!" });
      return;
    }
    // Note: In client-side, we can't easily access CRON_SECRET, 
    // so we should probably call the triggerBotCron directly since we are an Admin.
    setIsTriggering(true);
    setStatus(null);
    try {
      const res = await fetch("/api/bot/trigger", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus({ type: "success", msg: `Poll sent: ${data.question}` });
        // Refresh config to get new lastSentAt and update countdown
        const confRes = await fetch("/api/bot/config");
        const updatedConf = await confRes.json();
        if (updatedConf) setConfig(updatedConf);
      } else {
        setStatus({ type: "error", msg: data.error || "Execution failed" });
      }
    } catch {
      setStatus({ type: "error", msg: "Bot failure. Check logs." });
    } finally {
      setIsTriggering(false);
    }
  };

  // State for live countdown
  const [nextPollInfo, setNextPollInfo] = useState<{ time: string; countdown: string } | null>(null);

  useEffect(() => {
    if (!config?.isEnabled || !config?.lastSentAt) {
      setNextPollInfo(null);
      return;
    }

    const updateTime = () => {
      const seconds = (config.lastSentAt as unknown as { seconds: number }).seconds;
      if (!seconds) return;
      
      const last = new Date(seconds * 1000);
      const next = new Date(last.getTime() + config.intervalHours * 3600 * 1000);
      const now = new Date();
      
      const diffMs = next.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setNextPollInfo({ time: "Pending...", countdown: "Now" });
      } else {
        const h = Math.floor(diffMs / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        setNextPollInfo({
          time: next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          countdown: h > 0 ? `${h}h ${m}m` : `${m}m`
        });
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [config?.isEnabled, config?.lastSentAt, config?.intervalHours]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="wooden-panel p-6! space-y-6 bg-white/40 backdrop-blur-sm border-2 border-primary/10">
      <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="font-black text-foreground uppercase tracking-tighter">Oracle Control Center</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Advanced Bot Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
            <Sparkles size={12} className="text-secondary" /> Subject of the Day
          </label>
          <select 
            value={config?.subjectId || "random"}
            onChange={(e) => setConfig({ ...config!, subjectId: e.target.value })}
            className="w-full bg-surface border-2 border-border/10 rounded-xl py-3 px-4 text-sm font-bold focus:border-secondary outline-hidden transition-colors"
          >
            <option value="random">✨ Random Pool (All Subjects)</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Chat ID */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
            <Settings size={12} className="text-primary" /> Telegram Group ID
          </label>
          <input 
            type="text"
            value={config?.chatId || ""}
            placeholder="-100xxxxxxx"
            onChange={(e) => setConfig({ ...config!, chatId: e.target.value })}
            className="w-full bg-surface border-2 border-border/10 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary outline-hidden transition-colors"
          />
        </div>

        {/* Auto-Pilot Toggle */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
            <Sparkles size={12} className="text-blue-500" /> Auto-Pilot Status
          </label>
          <div className="flex items-center gap-3 bg-surface border-2 border-border/10 rounded-xl py-2 px-4">
            <button 
              onClick={() => setConfig({ ...config!, isEnabled: !config?.isEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${config?.isEnabled ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${config?.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm font-bold">{config?.isEnabled ? "ENABLED" : "PAUSED"}</span>
          </div>
        </div>

        {/* Interval Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
            <Loader2 size={12} className="text-amber-500" /> Poll Frequency
          </label>
          <select 
            value={config?.intervalHours || 2}
            onChange={(e) => setConfig({ ...config!, intervalHours: parseInt(e.target.value) })}
            className="w-full bg-surface border-2 border-border/10 rounded-xl py-3 px-4 text-sm font-bold focus:border-amber-500 outline-hidden transition-colors"
          >
            <option value={1}>Every 1 Hour</option>
            <option value={2}>Every 2 Hours</option>
            <option value={3}>Every 3 Hours</option>
            <option value={6}>Every 6 Hours</option>
            <option value={12}>Every 12 Hours</option>
            <option value={24}>Once per Day</option>
          </select>
        </div>
      </div>

      {!nextPollInfo && config?.isEnabled && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-center justify-between animate-in fade-in">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Ready for Launch</div>
            <div className="text-lg font-black text-amber-600 leading-none flex items-center gap-2">
              WAITING FOR TRANSMISSION
            </div>
          </div>
          <div className="text-right max-w-[150px]">
            <div className="text-[10px] font-bold text-amber-600 italic leading-tight">Click &quot;Trigger Test Poll&quot; below to initialize the schedule.</div>
          </div>
        </div>
      )}

      {nextPollInfo && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between animate-in fade-in duration-500">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">Next Oracle Transmission</div>
            <div className="text-lg font-black text-primary leading-none flex items-center gap-2">
              <Sparkles size={14} className="text-secondary animate-pulse" />
              IN {nextPollInfo.countdown}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right">Exact Time</div>
            <div className="text-xs font-bold text-primary italic">At {nextPollInfo.time}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-4 border-t border-primary/5">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? "SEALING..." : "SAVE CONFIG"}
        </button>

        <button 
          onClick={handleTrigger}
          disabled={isTriggering}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary text-white font-black px-6 py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
          {isTriggering ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {isTriggering ? "CONSULTING..." : "TRIGGER TEST POLL"}
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top ${
          status.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
          {status.msg}
        </div>
      )}
    </div>
  );
}
