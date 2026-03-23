import { useState, useEffect } from "react";
import { Subject, Lecture, DayPlan } from "@/types";
import { X, Sparkles, Loader2, BookOpen } from "lucide-react";
import { getLecturesBySubject } from "@/lib/weekplan-service";

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onAssign: (plan: DayPlan) => void;
  isLoading?: boolean;
  editingPlan?: DayPlan | null;
}

export default function AssignModal({ isOpen, onClose, subjects, onAssign, isLoading: externalLoading, editingPlan }: AssignModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  // Sync with editingPlan
  useEffect(() => {
    if (editingPlan) {
      setSelectedSubjectId(editingPlan.subjectId || "");
      setSelectedLectureId(editingPlan.lectureId || "");
    } else {
      setSelectedSubjectId("");
      setSelectedLectureId("");
      setLectures([]);
    }
  }, [editingPlan, isOpen]);

  // Fetch real lectures
  useEffect(() => {
    if (selectedSubjectId) {
      const fetch = async () => {
        setLoadingLectures(true);
        try {
          const fetched = await getLecturesBySubject(selectedSubjectId);
          setLectures(fetched);
        } catch (err) {
          console.error("Failed to fetch lectures:", err);
        } finally {
          setLoadingLectures(false);
        }
      };
      fetch();
    } else {
      setLectures([]);
    }
  }, [selectedSubjectId]);

  if (!isOpen) return null;

  const handleAssign = () => {
    if (selectedSubjectId && selectedLectureId) {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      const lecture = lectures.find(l => l.id === selectedLectureId);
      
      const plan: DayPlan = {
        id: editingPlan?.id || crypto.randomUUID(),
        status: editingPlan?.status || 'planned',
        subjectId: selectedSubjectId,
        subjectName: subject?.name || "Unknown",
        subjectColor: subject?.color || "var(--primary)",
        lectureId: selectedLectureId,
        lectureNumber: lecture?.order || 1,
        pomodoroCount: editingPlan?.pomodoroCount || 0,
      };

      onAssign(plan);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="wooden-panel w-full max-w-md space-y-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-section pb-4">
          <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            {editingPlan ? "Edit Quest" : "Assign Quest"} <Sparkles className="text-secondary w-5 h-5" />
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Subject Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Select Subject
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => {
                    setSelectedSubjectId(subject.id);
                    setSelectedLectureId(""); // Reset lecture on subject change
                  }}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedSubjectId === subject.id
                    ? "bg-surface-active ring-2 ring-primary"
                    : "bg-surface shadow-sm hover:shadow-md"
                   }`}
                >
                  <p className="text-xs font-bold leading-tight" style={{ color: subject.color }}>
                    {subject.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Real Lectures Fetching */}
          {selectedSubjectId && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Select Lecture
              </label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingLectures ? (
                  <div className="flex items-center justify-center p-8 gap-2 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-bold">Unrolling scrolls...</span>
                  </div>
                ) : lectures.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface/50 border-2 border-dashed border-border text-center">
                    <p className="text-xs font-medium text-muted-foreground">No lectures found for this subject.</p>
                  </div>
                ) : (
                  lectures.map((lecture) => (
                    <button
                      key={lecture.id}
                      onClick={() => setSelectedLectureId(lecture.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all flex justify-between items-center ${
                        selectedLectureId === lecture.id
                        ? "bg-surface-active ring-2 ring-primary"
                        : "bg-surface shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen size={14} className="text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          Lecture {lecture.order}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 border-primary ${selectedLectureId === lecture.id ? 'bg-primary' : ''}`} />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-muted-foreground hover:bg-surface-section transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedLectureId || externalLoading || loadingLectures}
            className="btn-primary flex-2 py-3 px-4 text-sm tracking-wider uppercase disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {externalLoading ? <Loader2 className="animate-spin" /> : <>{editingPlan ? "Update" : "Assign"} <Sparkles size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
