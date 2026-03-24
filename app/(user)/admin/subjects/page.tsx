"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { 
  fetchAllSubjects, 
  updateSubject, 
  deleteSubject, 
  createSubject 
} from "@/lib/admin-service";
import { Subject } from "@/types";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  AlertTriangle,
  X,
  Check,
  LayoutGrid
} from "lucide-react";
import { comfortaa, nunito } from "@/lib/fonts";
import Link from "next/link";

export default function SubjectsManagement() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const loadData = async () => {
    try {
      const data = await fetchAllSubjects();
      setSubjects(data);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/home");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newSubjectName.trim()) return;
    try {
      await createSubject(newSubjectName.trim());
      setNewSubjectName("");
      setIsAdding(false);
      loadData();
    } catch (_err) {
      alert("Failed to create subject");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateSubject(id, { name: editName, color: editColor });
      setEditingId(null);
      loadData();
    } catch (_err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`⚠️ DANGER: Deleting "${name}" will permanently erase ALL associated lectures and questions. Proceed?`)) {
      try {
        await deleteSubject(id);
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
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Inventorying the Realm...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-12 pb-20 ${nunito.className}`}>
      {/* Back to Dashboard */}
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
        <ChevronRight size={14} className="rotate-180" /> Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className={`${comfortaa.className} text-4xl text-foreground font-black tracking-tight`}>
            Subject Realm 🌿
          </h1>
          <p className="text-muted-foreground font-medium">Manage your curriculum subjects and their visual identities.</p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary px-8 py-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {/* Add New Subject Row */}
      {isAdding && (
        <div className="wooden-panel p-6 animate-in slide-in-from-top-4 flex flex-col sm:flex-row gap-4 items-center">
          <input 
            autoFocus
            type="text"
            placeholder="Subject Name (e.g. Oral Pathology)"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-1 bg-surface-section rounded-2xl px-6 py-4 text-sm font-bold outline-none ring-primary/20 focus:ring-4 transition-all"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleCreate} className="flex-1 sm:flex-initial bg-primary text-white p-4 rounded-2xl hover:bg-primary-active transition-colors">
              <Check size={20} />
            </button>
            <button onClick={() => setIsAdding(false)} className="flex-1 sm:flex-initial bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Subjects Table/List */}
      <div className="space-y-4">
        {subjects.map((sub) => (
          <div key={sub.id} className="wooden-panel group p-1 transition-all">
            {editingId === sub.id ? (
              <div className="p-5 space-y-6 animate-in fade-in zoom-in-95">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground pl-2 italic">Name</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-surface-section rounded-xl px-4 py-3 text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground pl-2 italic">Identity Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer p-0 bg-transparent border-0 overflow-hidden"
                        />
                         <input 
                          type="text"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="flex-1 bg-surface-section rounded-xl px-4 py-3 text-sm font-mono"
                        />
                      </div>
                   </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/10">
                   <button onClick={() => setEditingId(null)} className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Cancel</button>
                   <button onClick={() => handleUpdate(sub.id)} className="px-8 py-3 bg-secondary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md">Apply Changes</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                <div className="flex items-center gap-5">
                   <div 
                      className="w-14 h-14 rounded-2xl shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: `${sub.color}20` }}
                   >
                      <div 
                        className="w-8 h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: sub.color }}
                      />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold text-foreground leading-none">{sub.name}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Order #{sub.order}</span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] font-mono text-muted-foreground/60">{sub.id}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    href={`/admin/subjects/${sub.id}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <LayoutGrid size={16} />
                    Lectures
                  </Link>
                  
                  <button 
                    onClick={() => {
                      setEditingId(sub.id);
                      setEditName(sub.name);
                      setEditColor(sub.color);
                    }}
                    className="p-3 rounded-xl hover:bg-surface-section text-muted-foreground transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(sub.id, sub.name)}
                    className="p-3 rounded-xl hover:bg-tomato/5 text-muted-foreground hover:text-tomato transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="wooden-panel p-20 text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle size={48} className="text-muted-foreground/20" />
            </div>
            <p className="text-muted-foreground font-medium italic">The realm is empty. Forge your first subject to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
