"use client";

import { useEffect, useState } from "react";
import { fetchAllSubjects } from "@/lib/admin-service";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Subject, Lecture } from "@/types";
import Link from "next/link";
import { Comfortaa, Nunito } from "next/font/google";
import { GraduationCap, ChevronRight, ChevronDown, Loader2, Search, BookOpen, Sparkles, ArrowRight } from "lucide-react";

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "800"] });

export default function StudyLibraryPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lectures, setLectures] = useState<Record<string, Lecture[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLectureId, setExpandedLectureId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const subjs = await fetchAllSubjects();
        setSubjects(subjs);

        const lectsRef = collection(db, "lectures");
        const lectsSnap = await getDocs(lectsRef);
        const lectsMap: Record<string, Lecture[]> = {};

        lectsSnap.docs.forEach(doc => {
          const data = { id: doc.id, ...doc.data() } as Lecture;
          if (!lectsMap[data.subjectId]) lectsMap[data.subjectId] = [];
          lectsMap[data.subjectId].push(data);
        });

        // Sort lectures by order
        Object.keys(lectsMap).forEach(sid => {
          lectsMap[sid].sort((a, b) => a.order - b.order);
        });

        setLectures(lectsMap);
      } catch (err) {
        console.error("Library load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lectures[s.id]?.some(l => `Lecture ${l.order}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Opening Archives...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-10 pb-20 ${nunito.className}`}>
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className={`${comfortaa.className} text-3xl text-foreground font-bold`}>
          Study Library 📚
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Complete your dental mastery by revisiting past lectures or starting new ones from your curriculum.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text"
          placeholder="Search subjects or lectures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface border-none shadow-sm rounded-2xl outline-none focus:ring-2 ring-primary/20 transition-all font-semibold text-sm"
        />
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredSubjects.map((subject) => (
          <div key={subject.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: subject.color }}
              >
                <GraduationCap size={20} />
              </div>
              <h2 className={`${comfortaa.className} text-xl text-foreground font-bold`}>
                {subject.name}
              </h2>
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-auto">
                {lectures[subject.id]?.length || 0} Lectures
              </span>
            </div>

            <div className="bg-surface rounded-3xl shadow-sm overflow-hidden border border-border/5">
              {lectures[subject.id] && lectures[subject.id].length > 0 ? (
                <div className="divide-y divide-border/5">
                  {lectures[subject.id].map((lecture) => {
                    const isExpanded = expandedLectureId === lecture.id;

                    return (
                      <div key={lecture.id} className="flex flex-col">
                        <button 
                          onClick={() => setExpandedLectureId(isExpanded ? null : lecture.id)}
                          className={`w-full flex items-center justify-between p-5 transition-all text-left group ${
                            isExpanded ? "bg-primary/5" : "hover:bg-surface-active"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                              isExpanded ? "bg-primary text-white" : "bg-surface-section text-muted-foreground group-hover:bg-white group-hover:text-primary"
                            }`}>
                              {lecture.order}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-base font-bold transition-colors ${isExpanded ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                                {lecture.title || `Lecture ${lecture.order}`}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                {(lecture.quizzes?.length || 0) + (lecture.questions ? 1 : 0)} Quizzes Available
                              </span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown size={20} className="text-primary" /> : <ChevronRight size={20} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />}
                        </button>

                        {isExpanded && (
                          <div className="bg-surface-section/30 p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {/* Legacy Question Support */}
                            {lecture.questions && lecture.questions.length > 0 && (
                              <Link 
                                href={`/quiz/${lecture.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-all group/quiz"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  <BookOpen size={16} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground group-hover/quiz:text-primary transition-colors">Standard Quiz</span>
                                  <span className="text-[10px] font-bold text-muted-foreground/60">{lecture.questions.length} Questions</span>
                                </div>
                                <ArrowRight size={14} className="ml-auto text-muted-foreground/40 group-hover/quiz:text-primary group-hover/quiz:translate-x-1 transition-all" />
                              </Link>
                            )}

                            {/* New Quizzes Support */}
                            {lecture.quizzes?.map((quiz) => (
                              <Link 
                                key={quiz.id}
                                href={`/quiz/${lecture.id}?quizId=${quiz.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-all group/quiz"
                              >
                                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                                  <Sparkles size={16} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground group-hover/quiz:text-secondary transition-colors">{quiz.title}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground/60">{quiz.questions.length} Questions</span>
                                </div>
                                <ArrowRight size={14} className="ml-auto text-muted-foreground/40 group-hover/quiz:text-secondary group-hover/quiz:translate-x-1 transition-all" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground font-semibold italic">
                  No lectures available yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
