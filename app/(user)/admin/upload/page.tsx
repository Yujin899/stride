"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  fetchAllSubjects,
  createSubject,
  getNextLectureOrder,
  uploadLecture
} from "@/lib/admin-service";
import { Subject } from "@/types";
import {
  Plus,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  Search,
  Database
} from "lucide-react";
import Link from "next/link";

import { comfortaa, nunito } from "@/lib/fonts";

export default function AdminUploadPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  // Logic State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State - Step 1
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [nextOrder, setNextOrder] = useState<number | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  // Form State - Step 2
  const [notebookLMText, setNotebookLMText] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isNotebookLMCopied, setIsNotebookLMCopied] = useState(false);

  // Form State - Step 3
  const [jsonText, setJsonText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  // Helper: Number to Words for Lecture Titles
  const numberToWord = (n: number) => {
    const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
    return words[n] || n.toString();
  };

  // Security & Init
  useEffect(() => {
    console.log("AdminUpload: authLoading =", authLoading, "user =", user);
    if (!authLoading) {
      if (!user) {
        console.warn("AdminUpload: Redirecting to /home - user is null");
        router.push("/home");
      } else if (user.role !== "admin") {
        console.warn("AdminUpload: Redirecting to /home - role is", user.role);
        router.push("/home");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function init() {
      try {
        const data = await fetchAllSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Subject load error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Handlers - Step 1
  useEffect(() => {
    if (selectedSubjectId) {
      getNextLectureOrder(selectedSubjectId).then(setNextOrder);
    }
  }, [selectedSubjectId]);

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const sub = await createSubject(newSubjectName.trim());
      setSubjects(prev => [...prev, sub]);
      setSelectedSubjectId(sub.id);
      setIsAddingSubject(false);
      setNewSubjectName("");
    } catch (err) {
      console.error("Create subject error:", err);
    }
  };

  // Handlers - Step 2
  const handleGeneratePrompt = () => {
    if (!notebookLMText.trim()) return;
    const prompt = `Convert the following medical lecture content into a structured dental quiz JSON.
Requirements:
- Output ONLY a JSON array of questions, nothing else.
- Each question must follow this exact interface:
  interface Question {
    id: string; // generate a unique uuid
    type: 'mcq' | 'tf' | 'case';
    text: string;
    scenario?: string; // required ONLY for 'case' type
    options: string[]; // 4 for mcq, 2 for tf (["True", "False"])
    correctIndex: number;
    explanation: string; // clear explanation of the correct choice
  }
- Target 10-15 high-quality questions if possible.

Content:
${notebookLMText}`;
    setGeneratedPrompt(prompt);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handlers - Step 3
  const validateJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("Root must be an array");
      setValidationError(null);
      setIsValidated(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setValidationError(message);
      setIsValidated(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedSubjectId || !nextOrder || !isValidated) return;
    setIsSubmitting(true);
    try {
      const questions = JSON.parse(jsonText);
      const autoTitle = `Lecture ${numberToWord(nextOrder)}`;
      await uploadLecture(selectedSubjectId, nextOrder, true, questions, autoTitle);

      // Notify Telegram Bot
      try {
        fetch("/api/bot/notify-lecture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lectureTitle: autoTitle, subjectId: selectedSubjectId }),
        });
      } catch (_err) {
        console.error("Telegram notification failed silently.");
      }

      // Reset form
      setNotebookLMText("");
      setGeneratedPrompt("");
      setJsonText("");
      setIsValidated(false);
      alert(`${autoTitle} forged successfully! 🌿🍅`);

      // Refresh order
      getNextLectureOrder(selectedSubjectId).then(setNextOrder);
    } catch (err) {
      console.error("Final upload error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Heating the forge...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto space-y-12 pb-20 ${nunito.className}`}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">
        <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight size={10} className="opacity-30" />
        <span className="text-amber-600/60">Lecture Forge</span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className={`${comfortaa.className} text-4xl text-foreground font-bold`}>
          Lecture Forge 📜
        </h1>
        <p className="text-muted-foreground font-medium">Transform raw data into curriculum-ready mastery sessions.</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Step 1: Subject Selection */}
        <section className="wooden-panel p-8! space-y-6 shadow-warm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Search size={22} />
            </div>
            <h2 className={`${comfortaa.className} text-xl text-foreground font-bold`}>1. Select Subject 🌿</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2">Existing Subjects</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-surface-section rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all appearance-none"
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              {isAddingSubject ? (
                <div className="flex gap-2 animate-in slide-in-from-top-2">
                  <input
                    type="text"
                    placeholder="Subject Name (e.g. Endodontics)"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="flex-1 bg-surface-section rounded-xl px-4 py-2 text-sm font-bold outline-none"
                  />
                  <button
                    onClick={handleCreateSubject}
                    className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsAddingSubject(false)}
                    className="px-4 py-2 text-muted-foreground text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSubject(true)}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-active transition-colors px-2"
                >
                  <Plus size={14} />
                  Add New Subject
                </button>
              )}
            </div>

            {selectedSubjectId && nextOrder !== null && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Next Lecture Number</span>
                <span className="text-lg font-black text-primary">#{nextOrder} ({numberToWord(nextOrder)})</span>
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Prompt Generator */}
        <section className="wooden-panel p-8! space-y-6 shadow-warm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Sparkles size={22} />
            </div>
            <h2 className={`${comfortaa.className} text-xl text-foreground font-bold`}>2. Generate Prompt 🧙‍♂️</h2>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">1. NotebookLM Instructions</span>
                <button
                  onClick={() => {
                    const prompt = `You are a dental education assistant helping a dental student prepare for exams.

From this lecture, extract and organize ALL of the following in detail:

1. KEY CONCEPTS & DEFINITIONS
   - Every term introduced with its full definition
   - Any classifications or categories mentioned

2. MATERIALS & PROPERTIES
   - Name of each material/substance
   - Composition (ingredients/components)
   - Physical & mechanical properties
   - Advantages and disadvantages

3. CLINICAL PROCEDURES & STEPS
   - Step-by-step technique details
   - Indications and contraindications
   - Clinical tips or precautions mentioned

4. COMPARISONS
   - Any material vs. material comparisons
   - Any technique vs. technique comparisons

5. NUMBERS & SPECIFICS
   - All percentages, ratios, measurements, or timeframes
   - Setting times, working times, temperatures, pH values

6. EXAM-RELEVANT FACTS
   - Anything emphasized or repeated by the lecturer
   - Key distinctions and common points of confusion

Return the output as structured plain text with clear headers. Be exhaustive — do not summarize or skip details. Include everything, even points mentioned briefly.`;
                    navigator.clipboard.writeText(prompt);
                    setIsNotebookLMCopied(true);
                    setTimeout(() => setIsNotebookLMCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 text-[10px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  {isNotebookLMCopied ? <Check size={12} /> : <Copy size={12} />}
                  {isNotebookLMCopied ? "Copied!" : "Copy Instructions"}
                </button>
              </div>
              <p className="text-xs font-medium text-orange-800 leading-relaxed italic">
                &quot;Extract all key dental concepts, procedures, and definitions from this lecture in a clear, structured list. Focus on details that would be relevant for a professional dental board exam.&quot;
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between pl-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">2. NotebookLM Output</label>
              </div>
              <textarea
                placeholder="Paste the raw text from NotebookLM or your lecture summary here..."
                value={notebookLMText}
                onChange={(e) => setNotebookLMText(e.target.value)}
                className="w-full h-32 bg-surface-section rounded-2xl p-4 text-sm font-medium outline-none resize-y focus:ring-2 ring-orange-500/20 transition-all shadow-inner"
              />
            </div>

            <button
              onClick={handleGeneratePrompt}
              disabled={!notebookLMText}
              className="btn-primary w-full py-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Generate Claude Prompt
            </button>

            {generatedPrompt && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2">Final Prompt for Claude</label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedPrompt}
                    className="w-full h-32 bg-surface border border-border/50 rounded-2xl p-4 text-[10px] font-mono whitespace-pre outline-none shadow-sm"
                  />
                  <button
                    onClick={handleCopyPrompt}
                    className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm hover:bg-surface-section transition-all flex items-center gap-2 text-[10px] font-bold"
                  >
                    {isCopied ? <Check size={14} className="text-secondary" /> : <Copy size={14} />}
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Firestore Upload */}
        <section className="wooden-panel p-8! space-y-6 shadow-warm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Database size={22} />
            </div>
            <h2 className={`${comfortaa.className} text-xl text-foreground font-bold`}>3. Upload JSON 💾</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
              <span className="text-xs font-bold text-secondary/70 uppercase tracking-widest block mb-1">Target Title</span>
              <span className="text-lg font-black text-secondary">Lecture {nextOrder ? numberToWord(nextOrder) : '...'}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2">Claude JSON Output</label>
              <textarea
                placeholder="Paste the JSON array outputted by Claude here..."
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setIsValidated(false);
                }}
                className="w-full h-48 bg-surface-section rounded-2xl p-4 text-[11px] font-mono outline-none resize-y shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={validateJSON}
                disabled={!jsonText}
                className="w-full py-3 bg-white text-secondary border-2 border-secondary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-secondary/5 transition-all flex items-center justify-center gap-2"
              >
                {isValidated ? "Valid JSON ✅" : "Validate JSON 🔍"}
              </button>

              {validationError && (
                <div className="flex items-center gap-2 text-tomato text-xs font-bold p-3 bg-tomato/5 rounded-xl border border-tomato/10">
                  <AlertCircle size={14} />
                  {validationError}
                </div>
              )}

              <button
                onClick={handleFinalSubmit}
                disabled={!isValidated || !selectedSubjectId || nextOrder === null || isSubmitting}
                className="btn-primary w-full py-5 text-sm tracking-widest uppercase shadow-[0_6px_0_#5C420D] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : !selectedSubjectId ? (
                  "Select a Subject First 👆"
                ) : nextOrder === null ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Database size={18} />
                    Forge & Save to Realm ⚔️
                  </>
                )}
              </button>

              {!selectedSubjectId && isValidated && (
                <p className="text-[10px] text-tomato font-bold text-center animate-pulse uppercase tracking-wider">
                  Select a subject in Step 1 to enable saving!
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
