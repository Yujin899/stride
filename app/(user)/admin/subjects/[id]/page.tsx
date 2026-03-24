"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { 
  fetchAllSubjects, 
  fetchLecturesBySubject,
  deleteLecture,
  updateLecture
} from "@/lib/admin-service";
import { Subject, Lecture } from "@/types";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  Lock,
  Unlock,
  BookMarked,
  LayoutGrid
} from "lucide-react";
import { comfortaa, nunito } from "@/lib/fonts";
import Link from "next/link";

export default function SubjectLecturesManagement({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params);
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocked, setEditLocked] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const subs = await fetchAllSubjects();
      const currentSub = subs.find(s => s.id === subjectId);
      if (!currentSub) {
        router.push("/admin/subjects");
        return;
      }
      setSubject(currentSub);
      
      const data = await fetchLecturesBySubject(subjectId);
      setLectures(data);
    } catch (_err) {
      console.error("Load error");
    } finally {
      setIsLoading(false);
    }
  }, [subjectId, router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/home");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (id: string) => {
    try {
      await updateLecture(id, { title: editTitle, isLocked: editLocked });
      setEditingId(null);
      loadData();
    } catch (_err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        await deleteLecture(id);
        loadData();
      } catch (_err) {
        alert("Delete failed");
      }
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Retrieving Scripts...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-12 pb-20 ${nunito.className}`}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">
        <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight size={10} className="opacity-30" />
        <Link href="/admin/subjects" className="hover:text-primary transition-colors">Subjects</Link>
        <ChevronRight size={10} className="opacity-30" />
        <span className="text-primary/60">{subject?.name}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: subject?.color }} />
             <h1 className={`${comfortaa.className} text-4xl text-foreground font-black tracking-tight`}>
                Lectures 📜
             </h1>
          </div>
          <p className="text-muted-foreground font-medium italic pl-11">Curating knowledge for {subject?.name}.</p>
        </div>

        <Link 
          href="/admin/upload" 
          className="btn-primary px-8 py-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Forge New
        </Link>
      </div>

      {/* Lectures List */}
      <div className="space-y-4">
        {lectures.map((item) => (
          <div key={item.id} className="wooden-panel group p-1 transition-all">
            {editingId === item.id ? (
              <div className="p-5 space-y-6 animate-in fade-in zoom-in-95">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground pl-2 italic">Lecture Title</label>
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-surface-section rounded-xl px-4 py-3 text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground pl-2 italic">Student Access</label>
                      <button 
                        onClick={() => setEditLocked(!editLocked)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          editLocked ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700"
                        }`}
                      >
                         <span className="text-xs font-black uppercase tracking-widest">{editLocked ? "Locked / Coming Soon" : "Unlocked / Live"}</span>
                         {editLocked ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                   </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/10">
                   <button onClick={() => setEditingId(null)} className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Cancel</button>
                   <button onClick={() => handleUpdate(item.id)} className="px-8 py-3 bg-secondary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md">Forge Update</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-xl bg-surface-section flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <BookMarked size={24} />
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <h3 className="text-xl font-bold text-foreground leading-none">{item.title || `Lecture ${item.order}`}</h3>
                         {item.isLocked ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} className="text-primary-active" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Number #{item.order}</span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">{item.questions.length} Questions</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingId(item.id);
                      setEditTitle(item.title || `Lecture ${item.order}`);
                      setEditLocked(item.isLocked);
                    }}
                    className="p-3 rounded-xl hover:bg-surface-section text-muted-foreground transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(item.id, item.title || `Lecture ${item.order}`)}
                    className="p-3 rounded-xl hover:bg-tomato/5 text-muted-foreground hover:text-tomato transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {lectures.length === 0 && (
          <div className="wooden-panel p-20 text-center space-y-4">
            <LayoutGrid size={48} className="mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium italic">No scripts forged for this subject yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
