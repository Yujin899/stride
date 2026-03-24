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
      } else {
        setStatus({ type: "error", msg: data.error || "Execution failed" });
      }
    } catch {
      setStatus({ type: "error", msg: "Bot failure. Check logs." });
    } finally {
      setIsTriggering(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="wooden-panel p-6! space-y-6 bg-white/40 backdrop-blur-sm border-2 border-primary/10">
      <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="font-black text-foreground uppercase tracking-tighter">Telegram Oracle Monitor</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Automatic Daily Polls</p>
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
      </div>

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
