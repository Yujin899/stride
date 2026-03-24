"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toDate } from "@/lib/firebase/collections";
import { StudySession } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { handwriting, blackletter } from "@/lib/fonts";
import { X } from "lucide-react";
const FUNNY_TEMPLATES = [
  (name: string, mins: number, subject: string, date: string, lecture: string) => 
    `Hear Ye! The Tomato Council is utterly baffled. The Scholar ${name} actually spent ${mins} minutes focused on ${subject} during "${lecture}". On ${date}, the ink was dry, but the focus was fresh!`,
  
  (name: string, mins: number, subject: string, date: string, lecture: string) => 
    `By the grace of the Great Vine! On ${date}, ${name} entered a deep trance for ${mins} minutes. The subject? ${subject}. The result? A breakthrough in "${lecture}" that even the Elder Seeds couldn't predict.`,
  
  (name: string, mins: number, subject: string, date: string, lecture: string) => 
    `${name}, you absolute legend. ${mins} minutes of pure ${subject} on ${date}. The parchment practically smoked as you recorded your progress in "${lecture}". The Scrivener's hand is tired!`,
  
  (name: string, mins: number, subject: string, date: string, lecture: string) => 
    `Alert the guards! ${name} has been caught studying ${subject} for ${mins} minutes straight. This occurred on ${date} during "${lecture}". The Tomato Kingdom has never seen such scholarly discipline!`,
  
  (name: string, mins: number, subject: string, date: string, lecture: string) => 
    `On the sacred day of ${date}, the air smelled of basil as ${name} focused for ${mins} minutes. ${subject} was the challenge, and "${lecture}" was the scroll. Keep this up and you'll be a Master Ketchup in no time!`,
];

function buildMessage(session: StudySession, name: string): string {
  const date = toDate(session.completedAt);
  const dateStr = date ? format(date, "MMMM do, yyyy") : "a foggy past";
  const subject = session.subjectName || "The Secret Sauce";
  const lecture = session.lectureTitle?.slice(0, 40) || "The Unnamed Scroll";
  
  const hash = (session.id?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || session.durationMinutes) % FUNNY_TEMPLATES.length;
  return FUNNY_TEMPLATES[hash](name, session.durationMinutes, subject, dateStr, lecture);
}

// ─── SVG FILTERS ─────────────────────────────────────────────────────────────
const AgedFilters = () => (
  <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden>
    <defs>
      <filter id="ink-worn" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="5" result="noise" seed="2" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

// ─── AGE STAINS ───────────────────────────────────────────────────────────────
const AgeStains = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-lg" style={{ zIndex: 3 }}>
    <div className="absolute top-0 right-0 w-28 h-28 opacity-50"
      style={{ background: "radial-gradient(circle at top right, #2d1000 0%, transparent 70%)" }} />
    <div className="absolute bottom-0 left-6 w-36 h-24 opacity-30"
      style={{ background: "radial-gradient(ellipse, #1a0800 0%, transparent 70%)" }} />
    <div className="absolute top-20 left-4 w-24 h-18 opacity-15 rounded-full"
      style={{ background: "radial-gradient(ellipse, #7a5010 0%, transparent 80%)", transform: "rotate(-12deg)" }} />
    <div className="absolute bottom-24 right-6 w-16 h-22 opacity-10 rounded-full"
      style={{ background: "radial-gradient(ellipse, #5a3800 0%, transparent 80%)", transform: "rotate(18deg)" }} />
    {[
      { top: "18%", left: "14%", size: 5 },
      { top: "43%", left: "80%", size: 4 },
      { top: "68%", left: "22%", size: 6 },
      { top: "32%", left: "58%", size: 3 },
      { top: "78%", left: "68%", size: 7 },
      { top: "9%", left: "48%", size: 4 },
      { top: "55%", left: "35%", size: 3 },
    ].map((s, i) => (
      <div key={i} className="absolute rounded-full opacity-25"
        style={{ top: s.top, left: s.left, width: s.size, height: s.size, background: "#4a2e00" }} />
    ))}
    <svg className="absolute right-0 inset-y-0 h-full opacity-70" style={{ width: 16 }} viewBox="0 0 16 200" preserveAspectRatio="none">
      <path d="M16,0 Q10,8 14,18 Q16,28 12,38 Q8,48 14,58 Q16,68 11,78 Q6,88 13,98 Q16,108 10,118 Q5,128 12,138 Q16,148 9,158 Q4,168 13,178 Q16,188 14,200 L16,200 Z"
        fill="#0d0603" />
    </svg>
  </div>
);

// ─── IVY FRAME ────────────────────────────────────────────────────────────────
const IvyFrame = () => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
    {(["top-1 left-1 rotate-0", "top-1 right-1 rotate-90", "bottom-1 left-1 -rotate-90", "bottom-1 right-1 rotate-180"] as const).map((cls, i) => (
      <svg key={i} viewBox="0 0 60 60"
        className={`absolute w-10 h-10 sm:w-14 sm:h-14 opacity-[0.12] ${cls}`}
        style={{ fill: "#1A3D00" }}>
        <path d="M4,4 Q18,1 26,14 Q34,27 18,38 Q2,49 10,58 L4,59 Q-1,42 4,4" />
        <path d="M26,14 Q40,6 48,22 Q56,38 40,50 Q24,62 32,59" />
      </svg>
    ))}
  </div>
);

// ─── MAGIC PARTICLES ──────────────────────────────────────────────────────────
const Particle = ({ x, y, config }: { x: number; y: number; config: any }) => (
  <motion.div className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: config.size, height: config.size, background: config.color, zIndex: 50 }}
    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
    animate={{ opacity: 0, x: config.tx, y: config.ty, scale: 0 }}
    transition={{ duration: config.duration, ease: "easeOut" }}
  />
);

// ─── RUB HINT ─────────────────────────────────────────────────────────────────
const RubHint = ({ progress, show }: { progress: number; show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        style={{ zIndex: 20 }}>
        <p className={`${handwriting.className} text-[#8B5E1A] opacity-75`}
          style={{ fontSize: "clamp(0.7rem, 2vw, 0.9rem)" }}>
          Keep rubbing...
        </p>
        <div className="w-20 sm:w-28 h-1.5 rounded-full overflow-hidden bg-[#8B5E1A]/20">
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#C94A35,#D4AF37)", width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.08 }} />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── PAGE TEXT ────────────────────────────────────────────────────────────────
const PageText = ({ text, textKey }: { text: string; textKey: string }) => (
  <AnimatePresence mode="wait">
    <motion.div key={textKey}
      initial={{ opacity: 0, filter: "blur(14px) sepia(1) brightness(0.4)" }}
      animate={{ opacity: 1, filter: "blur(0px) sepia(0) brightness(1)" }}
      exit={{ opacity: 0, filter: "blur(14px) sepia(1) brightness(0.3)" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
      <p className={`${blackletter.className} text-[#3D1A00] text-center mb-2 sm:mb-4 opacity-60`}
        style={{ fontSize: "clamp(0.65rem, 2vw, 1rem)", filter: "url(#ink-worn)" }}>
        ~ Officium Tomatum ~
      </p>
      <p className={`${handwriting.className} text-[#1A0D00] text-center leading-relaxed`}
        style={{
          fontSize: "clamp(0.95rem, 2.8vw, 1.55rem)",
          textShadow: "0.5px 0.5px 0 rgba(0,0,0,0.12)",
          filter: "url(#ink-worn)",
        }}>
        {text}
      </p>
      <div className="mt-3 sm:mt-5 flex flex-col items-center gap-1 opacity-40">
        <div className="w-20 sm:w-36 h-px bg-[#3D1A00]" />
        <p className={`${handwriting.className} text-[#3D1A00]`}
          style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.7rem)" }}>
          Sealed in Tomato Wax
        </p>
      </div>
    </motion.div>
  </AnimatePresence>
);

// ─── PARCHMENT ────────────────────────────────────────────────────────────────
const MagicalParchment = ({
  session, onRubComplete, isLast,
}: {
  session?: StudySession;
  onRubComplete: (x: number, y: number) => void;
  isLast: boolean;
}) => {
  const { user } = useAuthStore();
  const studentName = user?.name || "Scholar";
  const message = session ? buildMessage(session, studentName) : "The tome awaits its first scholar...";
  const textKey = session?.id ?? "empty";

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const totalDist = useRef(0);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const THRESHOLD = 110;

  const startRub = (cx: number, cy: number) => {
    if (isLast) return;
    isDragging.current = true;
    lastPos.current = { x: cx, y: cy };
    setShowHint(true);
  };

  const moveRub = (cx: number, cy: number) => {
    if (!isDragging.current || isLast) return;
    const dx = cx - lastPos.current.x;
    const dy = cy - lastPos.current.y;
    totalDist.current += Math.sqrt(dx * dx + dy * dy);
    lastPos.current = { x: cx, y: cy };
    const p = Math.min((totalDist.current / THRESHOLD) * 100, 100);
    setProgress(p);

    if (totalDist.current >= THRESHOLD) {
      isDragging.current = false;
      totalDist.current = 0;
      setProgress(0);
      setShowHint(false);
      const rect = containerRef.current?.getBoundingClientRect();
      onRubComplete(rect ? cx - rect.left : cx, rect ? cy - rect.top : cy);
    }
  };

  const endRub = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    totalDist.current = 0;
    setProgress(0);
    setTimeout(() => setShowHint(false), 1000);
  };

  return (
    <div ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none"
      style={{
        borderRadius: "2px 6px 6px 2px",
        background: "linear-gradient(160deg,#c9a96e 0%,#b08840 35%,#9a7030 65%,#7d5520 100%)",
        cursor: isLast ? "default" : "grab",
      }}
      onMouseDown={(e) => startRub(e.clientX, e.clientY)}
      onMouseMove={(e) => moveRub(e.clientX, e.clientY)}
      onMouseUp={endRub}
      onMouseLeave={endRub}
      onTouchStart={(e) => { const t = e.touches[0]; startRub(t.clientX, t.clientY); }}
      onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; moveRub(t.clientX, t.clientY); }}
      onTouchEnd={endRub}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 25% 35%,#d4aa60 0%,#8a6020 55%,#4a2800 100%)", opacity: 0.65 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
          opacity: 0.6, mixBlendMode: "multiply" as const,
        }} />

      <AgeStains />
      <IvyFrame />
      <div className="absolute inset-y-0 left-0 w-8 sm:w-14 bg-linear-to-r from-black/55 to-transparent pointer-events-none" style={{ zIndex: 5 }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 26px,#3d1a00 26px,#3d1a00 27px)",
          backgroundPosition: "0 44px",
          zIndex: 2,
        }} />

      <div className="absolute inset-0 flex flex-col justify-center items-center p-5 sm:p-12" style={{ zIndex: 10 }}>
        <div className="mb-2 sm:mb-5 w-7 h-7 sm:w-11 sm:h-11 rounded-full border-2 border-[#8B1A1A]/50 bg-[#A42E1C]/15 flex items-center justify-center">
          <span className={`${handwriting.className} text-[#8B1A1A]/60 text-xs font-bold`}>S</span>
        </div>
        <div className="max-w-[87%] w-full">
          <PageText text={message} textKey={textKey} />
        </div>
      </div>

      <AnimatePresence>
        {!isLast && progress === 0 && !showHint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none text-center"
            style={{ zIndex: 20 }}
          >
            <p className={`${handwriting.className} text-[#5C3800] font-bold drop-shadow-sm`}
               style={{ fontSize: "clamp(1.1rem, 3.5vw, 1.45rem)", letterSpacing: "0.05em" }}>
              ✧ Rub the parchment to reveal ✧
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <RubHint progress={progress} show={showHint} />
    </div>
  );
};

// ─── BOOK COVER ───────────────────────────────────────────────────────────────
const BookCover = ({ isOpen, onOpen }: { isOpen: boolean; onOpen: () => void }) => {
  const { user } = useAuthStore();
  return (
    <motion.div
      initial={false}
      animate={{ rotateY: isOpen ? -138 : 0 }}
      transition={{ duration: 1.5, ease: [0.645, 0.045, 0.355, 1] }}
      style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
      className={`absolute inset-0 z-[200] ${isOpen ? "pointer-events-none" : "cursor-pointer"}`}
      onClick={() => !isOpen && onOpen()}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(155deg,#2A1810 0%,#1A0D06 45%,#100804 100%)",
          boxShadow: "8px 0 28px rgba(0,0,0,0.75), inset -3px 0 10px rgba(0,0,0,0.5)",
          backfaceVisibility: "hidden",
        }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 200 300" preserveAspectRatio="none">
          <path d="M20,10 Q25,50 18,80 Q12,115 22,155 Q28,185 15,225 Q8,255 20,290" stroke="#D4AF37" strokeWidth="0.6" fill="none" />
          <path d="M180,20 Q174,65 181,105 Q187,145 177,172 Q170,205 179,245" stroke="#D4AF37" strokeWidth="0.3" fill="none" />
          <path d="M60,5 Q66,28 59,56" stroke="#D4AF37" strokeWidth="0.4" fill="none" />
          <path d="M140,240 Q145,260 138,285" stroke="#D4AF37" strokeWidth="0.3" fill="none" />
        </svg>
        <div className="absolute inset-3 sm:inset-5 border border-[#D4AF37]/20 rounded-lg pointer-events-none" />
        <div className="absolute inset-5 sm:inset-8 border border-[#D4AF37]/08 rounded pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-6 p-6 text-center">
          <img src="/tomato.png" alt=""
            className="w-16 h-16 sm:w-28 sm:h-28 sepia brightness-[0.3] rotate-[-7deg] drop-shadow-2xl" />
          <div className="space-y-2 sm:space-y-3">
            <p className={`${blackletter.className} text-[#D4B87A]`}
              style={{ fontSize: "clamp(1rem, 3.2vw, 1.7rem)", letterSpacing: "0.08em" }}>
              Chronica Tomatum
            </p>
            <p className="text-[#D4AF37]/45 uppercase tracking-[0.4em]"
              style={{ fontSize: "clamp(0.42rem, 1.1vw, 0.58rem)" }}>
              Liber {user?.name || "Scholar"}
            </p>
            <div className="mt-1 px-3 py-1.5 sm:px-5 sm:py-2 border border-[#D4AF37]/30 rounded-full text-[#D4AF37]/65 hover:text-[#D4AF37] hover:border-[#D4AF37]/55 transition-all"
              style={{ fontSize: "clamp(0.48rem, 1.3vw, 0.62rem)", letterSpacing: "0.32em" }}>
              OPEN TOME
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 rounded-xl overflow-hidden"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#b89050" }}>
      </div>
    </motion.div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AncientChronicleBook({
  sessions,
}: {
  sessions: StudySession[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; config: any }[]>([]);
  const pidRef = useRef(0);

  const handleRubComplete = useCallback((x: number, y: number) => {
    const COLORS = ["#D4AF37", "#FFD700", "#C94A35", "#F5C5B0", "#fffacd", "#e8d5a3"];
    const burst = Array.from({ length: 24 }, () => {
      const angle = Math.random() * 360;
      const dist = 25 + Math.random() * 90;
      return {
        id: pidRef.current++,
        x, y,
        config: {
          tx: Math.cos((angle * Math.PI) / 180) * dist,
          ty: Math.sin((angle * Math.PI) / 180) * dist,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 2 + Math.random() * 4,
          duration: 0.9 + Math.random() * 0.5,
        }
      };
    });
    setParticles((p) => [...p, ...burst]);
    setTimeout(() => setParticles((p) => p.filter((pt) => !burst.find((b) => b.id === pt.id))), 1600);
    setCurrentPage((p) => Math.min(p + 1, sessions.length - 1));
  }, [sessions.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const currentSession = sessions[currentPage];
  const isLastPage = currentPage >= sessions.length - 1;

  return (
    <>
      <AgedFilters />
      <div className="w-full flex flex-col items-center py-8 sm:py-16 px-4">
        <div className="relative"
          style={{
            width: "min(88vw, 460px)",
            height: "min(128vw, 600px)",
            perspective: "2800px",
            transformStyle: "preserve-3d",
          }}>

          <div className="absolute inset-y-0 left-0 z-[150] pointer-events-none"
            style={{
              width: "clamp(9px, 2.2vw, 22px)",
              background: "linear-gradient(to right,#060301,#180b05,#0c0502)",
              borderRadius: "3px 0 0 3px",
              boxShadow: "-3px 0 14px rgba(0,0,0,0.65)",
            }} />

          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "2px 6px 6px 2px" }}>
            <MagicalParchment
              session={currentSession}
              onRubComplete={handleRubComplete}
              isLast={isLastPage}
            />
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 50 }}>
              <AnimatePresence>
                {particles.map((p) => <Particle key={p.id} x={p.x} y={p.y} config={p.config} />)}
              </AnimatePresence>
            </div>
          </div>

          <BookCover isOpen={isOpen} onOpen={() => setIsOpen(true)} />

          <AnimatePresence>
            {isOpen && sessions.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`${handwriting.className} absolute -top-7 right-0 text-[#5C3800]/55 pointer-events-none`}
                style={{ fontSize: "clamp(0.6rem, 1.8vw, 0.8rem)" }}>
                {currentPage + 1} / {sessions.length}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="mt-5 sm:mt-9 flex flex-col items-center gap-2.5 sm:gap-4">

              {!isLastPage ? (
                <p className={`${handwriting.className} text-[#5C3800]/55 text-center`}
                  style={{ fontSize: "clamp(0.7rem, 2vw, 0.95rem)" }}>
                  ✧ Rub the parchment to reveal next record ✧
                </p>
              ) : (
                <p className={`${handwriting.className} text-[#5C3800]/45 text-center`}
                  style={{ fontSize: "clamp(0.65rem, 1.8vw, 0.85rem)" }}>
                  ~ End of Chronicle ~
                </p>
              )}

              <button
                onClick={() => { setIsOpen(false); setCurrentPage(0); }}
                className="mt-1 flex items-center gap-2 px-5 py-2 rounded-full border border-[#5C3800]/25 text-[#5C3800]/60 hover:text-[#5C3800] hover:border-[#5C3800]/50 transition-all active:scale-95"
                style={{ fontSize: "clamp(0.58rem, 1.5vw, 0.72rem)", letterSpacing: "0.2em" }}>
                <X size={11} />
                <span className={`${handwriting.className} uppercase tracking-widest`}>Close Tome</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}