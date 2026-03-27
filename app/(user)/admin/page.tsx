"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { fetchAllSubjects } from "@/lib/admin-service";
import { Subject } from "@/types";
import { 
  BookOpen, 
  PlusCircle, 
  Zap,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Database,
  Sparkles
} from "lucide-react";
import { comfortaa, nunito } from "@/lib/fonts";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/home");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAllSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Syncing with the Realm...</p>
      </div>
    );
  }

  const adminCards = [
    {
      title: "Lecture Forge",
      desc: "Create and upload brand new lectures with AI assistance.",
      icon: <PlusCircle size={32} />,
      link: "/admin/upload",
      color: "from-amber-500 to-orange-600",
      badge: "Builder"
    },
    {
      title: "Quiz Expansion",
      desc: "Add new quiz parts to existing lectures and notify users.",
      icon: <Sparkles size={32} />,
      link: "/admin/upload-quiz",
      color: "from-orange-400 to-amber-500",
      badge: "Expander"
    },
    {
      title: "Subject Realm",
      desc: "Manage existing subjects, edit details, and clean up content.",
      icon: <BookOpen size={32} />,
      link: "/admin/subjects",
      color: "from-primary to-primary-active",
      badge: "Librarian"
    },
    {
      title: "Oracle Bot",
      desc: "Configure the Telegram bot scheduling and automation.",
      icon: <Zap size={32} />,
      link: "/admin/oracle",
      color: "from-secondary to-purple-700",
      badge: "Architect"
    }
  ];

  return (
    <div className={`max-w-4xl mx-auto space-y-12 pb-20 ${nunito.className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/10 pb-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} />
            Admin Controller
          </div>
          <h1 className={`${comfortaa.className} text-4xl md:text-5xl text-foreground font-black tracking-tight`}>
            Command Center
          </h1>
          <p className="text-muted-foreground font-medium text-lg">Greetings, High Administrator. The realm is at your disposal.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="wooden-panel p-4 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-2xl font-black text-primary">{subjects.length}</span>
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Subjects</span>
           </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card, idx) => (
          <Link key={idx} href={card.link} className="group outline-none">
            <div className="wooden-panel h-full p-8 space-y-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">
                {card.badge}
              </div>

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${card.color} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
                {card.icon}
              </div>
              
              <div className="space-y-2">
                <h3 className={`${comfortaa.className} text-xl font-bold text-foreground group-hover:text-primary transition-colors`}>{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>

              <div className="pt-4 flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest group-hover:gap-4 transition-all">
                Enter View <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats or Logs could go here */}
      <section className="wooden-panel p-8 space-y-6 bg-linear-to-br from-surface to-surface-section border-primary/5">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <Database className="text-primary" size={20} />
          <h2 className={`${comfortaa.className} text-lg font-bold`}>System Integrations</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="p-4 rounded-xl bg-white shadow-sm border border-border/50 flex items-center justify-between">
              <span className="text-sm font-bold opacity-60">Firebase Cloud</span>
              <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-[10px] font-black uppercase">Connected</span>
           </div>
           <div className="p-4 rounded-xl bg-white shadow-sm border border-border/50 flex items-center justify-between">
              <span className="text-sm font-bold opacity-60">Telegram Oracle</span>
              <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black uppercase">Active</span>
           </div>
        </div>
      </section>
    </div>
  );
}
