"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Comfortaa, Nunito } from "next/font/google";
import { ChevronLeft, CheckCircle2, XCircle, Home, RefreshCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchQuiz, saveMistake } from "@/lib/quiz-service";
import { addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import { playClick } from "@/lib/audio";
import { Lecture } from "@/types";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function QuizPage() {
  const { lectureId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBulletRef = useRef<HTMLDivElement>(null);

  // Fetch Quiz Data
  useEffect(() => {
    async function init() {
      if (!lectureId) return;
      try {
        const data = await fetchQuiz(lectureId as string);
        if (data) setLecture(data);
      } catch (err) {
        console.error("Quiz init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [lectureId]);

  // 2. Scroll to top on question change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentIndex, isFinished]);

  // 3. Auto-scroll progress bullets
  useEffect(() => {
    if (activeBulletRef.current) {
      activeBulletRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  const questions = lecture?.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleOptionClick = async (index: number) => {
    // Play high-performance click
    playClick();

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else if (user) {
      // Background save mistake with the index of the wrong answer chosen
      saveMistake(user.id, lecture!.id, lecture!.subjectId, currentQuestion.id, index).catch(err => {
        console.error("Failed to save mistake:", err);
      });
    }
  };

  const nextQuestion = () => {
    // Play high-performance click
    playClick();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  // 4. Handle Completion Analysis
  const [isPassed, setIsPassed] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isFinished && lecture && user) {
      const percentage = (score / questions.length) * 100;
      const passed = percentage >= 60;
      setIsPassed(passed);

      if (passed) {
        setIsSaving(true);
        import("@/lib/weekplan-service").then(({ completeQuest }) => {
          completeQuest(user.id, lecture.id, Math.round(percentage))
            .finally(() => setIsSaving(false));
        });
      }
    }
  }, [isFinished, score, questions.length, lecture, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-(--background)">
        <Loader2 className="w-12 h-12 text-(--primary) animate-spin mb-4" />
        <p className="text-sm font-bold text-(--muted-foreground) uppercase tracking-[0.2em]">Preparing your Quest...</p>
      </div>
    );
  }

  if (!lecture || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className={`${comfortaa.className} text-2xl font-bold mb-4`}>Quiz Not Found 📜</h2>
        <p className="text-(--muted-foreground) mb-8">We couldn&apos;t find the quiz for this lecture.</p>
        <Link href="/home" className="btn-primary px-8 py-3">Return Home</Link>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-(--background) animate-in fade-in duration-500">
        <div className="wooden-panel max-w-md w-full text-center space-y-8">
          <div className="relative w-32 h-32 mx-auto">
             <Image 
               src={isPassed ? "/tomato.png" : "/mistakes.png"} 
               alt="Status" 
               fill 
               className={`object-contain ${isPassed ? "animate-bounce" : "opacity-50"}`} 
             />
          </div>
          
          <div className="space-y-2">
            <h1 className={`${comfortaa.className} text-3xl font-bold text-(--foreground)`}>
              {isPassed ? "Quest Complete! 🎉" : "Quest Unfinished ⚔️"}
            </h1>
            <p className={`${nunito.className} text-lg font-semibold text-(--muted-foreground)`}>
              {isPassed 
                ? "You mastered the topic and secured the quest!" 
                : "You need 60% to secure this quest. Keep refining your knowledge!"}
            </p>
          </div>

          <div className={`rounded-3xl p-6 border-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] ${
            isPassed ? "bg-(--surface-active) border-(--border)/20" : "bg-tomato/5 border-tomato/20"
          }`}>
            <div className={`text-4xl font-black mb-1 ${isPassed ? "text-(--primary)" : "text-tomato"}`}>
              {score} / {questions.length}
            </div>
            <div className="text-[10px] font-black text-(--muted-foreground) uppercase tracking-[0.3em]">
              Score: {percentage}%
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isPassed ? (
              <>
                <button 
                  onClick={() => router.push("/home")}
                  disabled={isSaving}
                  className="btn-primary w-full py-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <>Continue Home <Home size={18} /></>}
                </button>
                <button 
                  onClick={() => router.push("/mistakes")}
                  className="w-full py-4 text-sm font-bold text-(--muted-foreground) hover:bg-(--surface-active) rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  Review Mistakes <XCircle size={18} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentIndex(0);
                    setScore(0);
                    setIsAnswered(false);
                    setSelectedOption(null);
                    setIsPassed(null);
                  }}
                  className="btn-primary w-full py-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2 bg-tomato hover:bg-tomato/90 border-tomato/20 shadow-tomato/20"
                >
                  Try Again <RefreshCcw size={18} />
                </button>
                <button 
                  onClick={() => router.push("/home")}
                  className="w-full py-4 text-sm font-bold text-(--muted-foreground) border-2 border-border/10 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  Return to Dashboard <Home size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${nunito.className}`}>
      {/* Navigation */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <Link 
          href={`/study/${lectureId}`}
          className="flex items-center gap-2 text-(--muted-foreground) hover:text-(--foreground) font-semibold transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>
        <div className="text-[10px] sm:text-xs font-black text-(--muted-foreground) uppercase tracking-[0.2em] bg-white/50 px-3 py-1 rounded-full">
          Boss Fight: Lecture {lecture.order}
        </div>
        <div className="hidden sm:block w-20" /> {/* Spacer */}
      </div>

      <div className="w-full max-w-3xl mb-8 flex justify-center">
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 px-6 bg-white/80 rounded-full shadow-sm backdrop-blur-md border border-white/20"
        >
          {questions.map((_, idx) => (
            <div 
              key={idx} 
              ref={idx === currentIndex ? activeBulletRef : null}
              className={`relative w-8 h-8 flex-shrink-0 transition-all duration-500 transform ${
                idx === currentIndex ? "scale-125 z-10" : "scale-100"
              } ${
                idx < currentIndex ? "opacity-100" : 
                idx === currentIndex ? "opacity-100" : 
                "opacity-20 grayscale"
              }`}
            >
              <Image src="/tomato.png" alt="Tomato" fill className="object-contain" />
              {idx === currentIndex && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Question Panel */}
      <main className="w-full max-w-3xl animate-in slide-in-from-bottom-4 duration-500">
        <div className="wooden-panel space-y-8">
          {/* Case Study Scenario */}
          {currentQuestion.scenario && (
            <div className="bg-(--surface-active) rounded-2xl p-6 border-l-4 border-(--primary) relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <RefreshCcw size={48} className="rotate-12" />
              </div>
              <h4 className={`${comfortaa.className} text-xs font-bold text-(--primary) uppercase tracking-widest mb-3`}>
                Case Scenario 📋
              </h4>
              <p className="text-sm italic text-(--foreground) leading-relaxed">
                &quot;{currentQuestion.scenario}&quot;
              </p>
            </div>
          )}

          <h2 className={`${comfortaa.className} text-xl sm:text-2xl text-(--foreground) font-bold leading-tight`}>
            {currentQuestion.text}
          </h2>

          {/* Options Grid */}
          <div className={`grid gap-3 ${currentQuestion.type === "tf" ? "grid-cols-2" : "grid-cols-1"}`}>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              const showCheck = isAnswered && isCorrect;
              const showCross = isAnswered && isSelected && !isCorrect;

              let buttonClass = "bg-(--surface) border-(--border)/30 hover:bg-(--surface-active) hover:border-(--border) text-(--foreground)";
              
              if (isAnswered) {
                if (isCorrect) {
                  buttonClass = "bg-[#EEF7F1] border-(--secondary) text-(--secondary) shadow-[0_0_20px_rgba(74,138,95,0.1)]";
                } else if (isSelected) {
                  buttonClass = "bg-[#FDF2F0] border-(--destructive) text-(--destructive)";
                } else {
                  buttonClass = "opacity-50 grayscale-[0.5] border-(--border)/20";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered}
                  className={`
                    w-full min-h-[4rem] px-6 py-4 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group
                    ${buttonClass}
                    ${!isAnswered && "active:translate-y-1 active:shadow-inner"}
                  `}
                >
                  <span className="flex-1">{option}</span>
                  {showCheck && <CheckCircle2 size={24} className="text-(--secondary) animate-in zoom-in duration-300" />}
                  {showCross && <XCircle size={24} className="text-(--destructive) animate-in zoom-in duration-300" />}
                </button>
              );
            })}
          </div>

          {/* Scholar's Note (Explanation) */}
          {isAnswered && (
            <div className="pt-4 animate-in slide-in-from-top-2 fade-in duration-500">
              <div className="bg-(--surface-active) rounded-3xl p-6 border-2 border-(--border)/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📜</span>
                  <h4 className={`${comfortaa.className} text-sm font-bold text-(--primary)`}>Scholar&apos;s Note</h4>
                </div>
                <p className="text-sm text-(--foreground) leading-relaxed mb-6 font-medium">
                  {currentQuestion.explanation}
                </p>
                <button 
                  onClick={nextQuestion}
                  className="btn-primary w-full py-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2 group"
                >
                  {currentIndex === questions.length - 1 ? "Finish Quest 🎯" : "Next Question ❱"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <div className="mt-8 text-[10px] font-bold text-(--muted-foreground) uppercase tracking-[0.2em]">
        Quest Progression: {currentIndex + 1} of {questions.length}
      </div>
    </div>
  );
}
