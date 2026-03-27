import { Timestamp } from "firebase/firestore";

/**
 * users collection
 */
export interface User {
  id: string;              // Firebase Auth UID
  name: string;            // display name
  pin: string;             // hashed 4-digit PIN
  role: "user" | "admin";  // default: "user"
  streak: number;          // current streak days
  lastStudiedAt: Timestamp;
  createdAt: Timestamp;
}

/**
 * subjects collection
 */
export interface Subject {
  id: string;
  name: string;            // e.g. "Oral Biology"
  color: string;           // hex — assigned per subject for grid coloring
  order: number;           // display order
  createdAt: Timestamp;
}

/**
 * lectures collection
 */
export interface Question {
  id: string;
  type: "mcq" | "tf" | "case";
  text: string;
  scenario?: string;       // for case type only
  options: string[];       // mcq: 4 options, tf: ["True", "False"]
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Timestamp;
}

export interface Lecture {
  id: string;
  subjectId: string;       // ref: subjects
  title?: string;          // optional display title
  order: number;           // auto: 1, 2, 3... per subject
  isLocked: boolean;       // default: true
  questions?: Question[];  // legacy: questions at root
  quizzes?: Quiz[];        // new: array of quizzes
  createdAt: Timestamp;
}

/**
 * quizAttempts collection
 */
export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lectureId: string;
  subjectId: string;
  answers: QuizAnswer[];
  score: number;           // percentage 0-100
  completedAt: Timestamp;
}

/**
 * mistakes collection
 */
export interface Mistake {
  id: string;
  userId: string;
  questionId: string;
  lectureId: string;
  subjectId: string;
  count: number;           // how many times got it wrong
  isReviewed: boolean;     // default: false
  lastSeenAt: Timestamp;
  wrongAnswerIndex?: number; // Added to store the actual wrong choice
}

export interface StudySession {
  id: string;
  userId: string;
  lectureId?: string;
  lectureTitle?: string;
  subjectId?: string;
  subjectName?: string;
  durationMinutes: number;
  type: "work" | "break";
  completedAt: Date | Timestamp;
  xpEarned: number;
}
export interface BotConfig {
  id: string;
  subjectId: string;        // "random" or subjectId
  chatId?: string;
  lastSentAt?: Timestamp;
  isEnabled: boolean;       // Auto-Pilot toggle
  intervalHours: number;    // Frequency (1, 2, 3...)
  intervalMinutes?: number;  // Test Frequency (e.g. 2, 5)
}
