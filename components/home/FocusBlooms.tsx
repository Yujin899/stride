"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { QuizAttempt } from "@/types";
import { motion } from "framer-motion";

interface FocusBloomsProps {
  quizzes: QuizAttempt[];
}

export default function FocusBlooms({ quizzes }: FocusBloomsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (quizzes.length === 0) {
    return (
      <div className="wooden-panel p-4! bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-primary/10 shadow-sm flex flex-col items-center sm:items-end gap-3 min-w-[200px]">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Today&apos;s Focus Blooms</span>
        <span className="text-xs font-bold text-muted-foreground/40 italic">Complete a quiz to bloom...</span>
      </div>
    );
  }

  return (
    <div className="wooden-panel p-4! bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-primary/10 shadow-sm flex flex-col items-center sm:items-end gap-3 min-w-[200px] w-full max-w-full overflow-hidden">
      <div className="flex w-full items-center justify-between sm:justify-end gap-4">
         <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Today&apos;s Focus Blooms</span>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full justify-center sm:justify-end mask-fade-edges"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {quizzes.map((quiz, i) => {
          const score = quiz.score || 0;
          const opacity = Math.max(0.3, score / 100);
          
          return (
            <motion.div 
              key={quiz.id || i} 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="shrink-0 bounce-subtle"
              style={{ scrollSnapAlign: "center" }}
              title={`Scored ${score}%`}
            >
              <div style={{ opacity }}>
                <Image 
                  src="/tomato.png" 
                  alt="Tomato" 
                  width={34} 
                  height={34} 
                  className="object-contain drop-shadow-md sm:w-[40px] sm:h-[40px]" 
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <span className="text-[10px] font-bold text-secondary">
        {quizzes.length} Quiz{quizzes.length > 1 ? 'zes' : ''} Completed
      </span>
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
        @media (min-width: 640px) {
          .mask-fade-edges {
            mask-image: none;
          }
        }
      `}</style>
    </div>
  );
}
