"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  fetchAllSubjects,
  uploadLecture,
  fetchLecturesBySubject
} from "@/lib/admin-service";
import { Subject, Lecture } from "@/types";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  Search,
  Database,
  ArrowLeft,
  Brain
} from "lucide-react";
import Link from "next/link";
import { comfortaa, nunito } from "@/lib/fonts";

export default function QuizExpansionPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  // Logic State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State - Selection
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [existingLectures, setExistingLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState("");
  
  // Form State - Content
  const [quizTitle, setQuizTitle] = useState("");
  const [notebookLMText, setNotebookLMText] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isNotebookLMCopied, setIsNotebookLMCopied] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [existingQuestionsJson, setExistingQuestionsJson] = useState("");
  const [isExistingJsonCopied, setIsExistingJsonCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  // Helper: Number to Words
  const numberToWord = (n: number) => {
    const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
    return words[n] || n.toString();
  };

  // Auth Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/home");
      }
    }
  }, [user, authLoading, router]);

  // Load Subjects
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

  // Load Lectures when subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      fetchLecturesBySubject(selectedSubjectId).then(setExistingLectures);
      setSelectedLectureId("");
      setExistingQuestionsJson("");
    }
  }, [selectedSubjectId]);

  // Handle Lecture Selection & Build Redundancy JSON
  useEffect(() => {
    if (selectedLectureId) {
      const lecture = existingLectures.find(l => l.id === selectedLectureId);
      if (lecture) {
        // Aggregate all current questions
        const standardQuestions = lecture.questions || [];
        const extraQuestions = (lecture.quizzes || []).flatMap(q => q.questions || []);
        const allQuestions = [...standardQuestions, ...extraQuestions];
        
        if (allQuestions.length > 0) {
          setExistingQuestionsJson(JSON.stringify(allQuestions, null, 2));
        } else {
          setExistingQuestionsJson("");
        }
      }
    } else {
      setExistingQuestionsJson("");
    }
  }, [selectedLectureId, existingLectures]);

  // Handlers
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
    if (!selectedSubjectId || !selectedLectureId || !isValidated) return;
    setIsSubmitting(true);
    try {
      const questions = JSON.parse(jsonText);
      const lecture = existingLectures.find(l => l.id === selectedLectureId);
      if (!lecture) return;

      const finalQuizTitle = quizTitle.trim() || `Part ${numberToWord((lecture.quizzes?.length || 0) + 1)}`;
      const lectureTitle = lecture.title || `Lecture ${lecture.order}`;

      await uploadLecture(selectedSubjectId, lecture.order, true, questions, lectureTitle, finalQuizTitle);

      // Notify Telegram Bot
      try {
        await fetch("/api/bot/notify-lecture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            lectureTitle, 
            subjectId: selectedSubjectId,
            quizTitle: finalQuizTitle
          }),
        });
      } catch (err) {
        console.error("Telegram notification failed silently.", err);
      }

      alert(`Success! Expanded ${lectureTitle} with ${finalQuizTitle} 🌿`);
      router.push("/admin");
    } catch (err) {
      console.error("Expansion error:", err);
      alert("Expansion failed. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Preparing expansion tools...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto space-y-10 pb-20 ${nunito.className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest">
          Quiz Expansion
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className={`${comfortaa.className} text-4xl text-foreground font-black`}>
          Expand Knowledge 🧩
        </h1>
        <p className="text-muted-foreground font-medium">Add new quiz modules to your existing lectures.</p>
      </div>

      {/* Main Flow */}
      <div className="space-y-6">
        {/* Step 1: Target Selection */}
        <section className="wooden-panel p-8! space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Search size={22} />
            </div>
            <h2 className={`${comfortaa.className} text-xl text-foreground font-bold`}>1. Select Target 🌿</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2 italic">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-surface-section rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all appearance-none"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2 italic">Parent Lecture</label>
              <select
                value={selectedLectureId}
                disabled={!selectedSubjectId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className="w-full bg-surface-section rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all appearance-none disabled:opacity-50"
              >
                <option value="">-- Select Lecture --</option>
                {existingLectures.map(l => (
                  <option key={l.id} value={l.id}>{l.title || `Lecture ${l.order}`}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Step 1.5: Redundancy Check (Only if questions exist) */}
        {existingQuestionsJson && (
          <section className="wooden-panel p-8! space-y-4 bg-primary/5! border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Brain size={18} />
                </div>
                <h2 className={`${comfortaa.className} text-lg text-foreground font-bold`}>Redundancy Check 🧠</h2>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(existingQuestionsJson);
                  setIsExistingJsonCopied(true);
                  setTimeout(() => setIsExistingJsonCopied(false), 2000);
                }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
              >
                {isExistingJsonCopied ? <Check size={14} /> : <Copy size={14} />}
                {isExistingJsonCopied ? "Copied Existing!" : "Copy Current Questions"}
              </button>
            </div>
            
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              Copy this JSON and provide it to the AI to ensure no questions are repeated in the new module.
            </p>

            <div className="relative group">
              <div className="max-h-32 overflow-y-auto rounded-xl bg-surface-section/50 border border-primary/10 p-4 custom-scrollbar">
                <pre className="text-[9px] font-mono text-muted-foreground/70 whitespace-pre">
                  {existingQuestionsJson}
                </pre>
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-background/20 to-transparent pointer-events-none" />
            </div>
          </section>
        )}

        {/* Step 2: Content Generation */}
        <section className="wooden-panel p-8! space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Sparkles size={22} />
            </div>
            <h2 className={`${comfortaa.className} text-xl text-foreground font-bold`}>2. Generate Content 🪄</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2 italic">0. Quiz Part Title (e.g. Final Review)</label>
              <input 
                type="text"
                placeholder="Name this specific quiz module..."
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full bg-surface-section rounded-xl px-4 py-3 text-sm font-bold outline-none border border-border/10 focus:ring-2 ring-primary/10 transition-all shadow-inner"
              />
            </div>

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
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2 italic">2. NotebookLM Data</label>
              <textarea
                placeholder="Paste the source text for this specific quiz part..."
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
              <Sparkles size={18} /> Generate System Prompt
            </button>

            {generatedPrompt && (
              <div className="space-y-2 p-4 bg-surface rounded-2xl border border-border/50 relative">
                <p className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed opacity-70 mb-4">{generatedPrompt}</p>
                <button
                  onClick={handleCopyPrompt}
                  className="absolute bottom-4 right-4 p-3 bg-secondary text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-black uppercase"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? "Copied" : "Copy Prompt"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Final Upload */}
        <section className="wooden-panel p-8! space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Database size={22} />
            </div>
            <h2 className={`${comfortaa.className} text-xl text-foreground font-bold`}>3. Deploy Quiz 🚀</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 pl-2 italic">JSON Array from Claude</label>
              <textarea
                placeholder="Paste the generated JSON array here..."
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setIsValidated(false);
                }}
                className="w-full h-48 bg-surface-section rounded-2xl p-4 text-[11px] font-mono outline-none resize-y"
              />
            </div>

            <div className="flex flex-col gap-3">
               <button
                 onClick={validateJSON}
                 disabled={!jsonText}
                 className="w-full py-3 bg-white text-secondary border-2 border-secondary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-secondary/5 transition-all"
               >
                 {isValidated ? "JSON Validated ✅" : "Validate JSON 🔍"}
               </button>

               {validationError && (
                 <p className="text-[10px] text-tomato font-bold text-center bg-tomato/5 p-2 rounded-lg">{validationError}</p>
               )}

               <button
                 onClick={handleFinalSubmit}
                 disabled={!isValidated || !selectedLectureId || isSubmitting}
                 className="btn-primary w-full py-5 text-sm tracking-widest uppercase shadow-[0_6px_0_#5C420D] flex items-center justify-center gap-2"
               >
                 {isSubmitting ? <Loader2 className="animate-spin" /> : (
                   <>
                     <Database size={18} />
                     Commit Expansion ⚔️
                   </>
                 )}
               </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
