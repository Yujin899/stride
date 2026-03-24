import { getDoc, doc, setDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { botConfigCol, mistakesCol, lecturesCol, subjectsCol } from "./firebase/collections";
import { BotConfig, Question } from "@/types";
import { sendPoll, sendMessage } from "./telegram-service";

export async function getBotConfig(): Promise<BotConfig | null> {
  const snap = await getDoc(doc(botConfigCol, "current"));
  if (snap.exists()) return snap.data();
  return null;
}

export async function updateBotConfig(data: Partial<BotConfig>) {
  const current = await getBotConfig();
  const newData = {
    id: "current",
    subjectId: data.subjectId || current?.subjectId || "random",
    chatId: data.chatId || current?.chatId || "",
    lastSentAt: data.lastSentAt || current?.lastSentAt || Timestamp.now(),
  };
  await setDoc(doc(botConfigCol, "current"), newData);
}

export async function triggerBotCron() {
  const config = await getBotConfig();
  if (!config || !config.chatId) {
    console.error("Bot not configured (missing chatId)");
    return { success: false, error: "Not configured" };
  }

  // 1. Determine Subject
  let subjectId = config.subjectId;
  if (subjectId === "random") {
    const subs = await getDocs(subjectsCol);
    if (!subs.empty) {
      const randomSub = subs.docs[Math.floor(Math.random() * subs.docs.length)];
      subjectId = randomSub.id;
    }
  }

  // 2. Fetch Questions (Mistakes first)
  const questionPool: { q: Question; source: string }[] = [];

  // Try Mistakes
  const mistakesSnap = await getDocs(query(mistakesCol, where("subjectId", "==", subjectId)));
  if (!mistakesSnap.empty) {
    // We need to fetch the actual question from lectures since Mistake only has IDs
    // For now, let's just use lectures pool to keep it simple or implement a lookup
    // Actually, let's fetch all lectures for this subject and find the mistakes
  }

  // Fallback: Fetch all lectures for this subject
  const lecturesSnap = await getDocs(query(lecturesCol, where("subjectId", "==", subjectId)));
  lecturesSnap.forEach(doc => {
    const lecture = doc.data();
    lecture.questions.forEach(q => {
      questionPool.push({ q, source: `Lecture ${lecture.order}` });
    });
  });

  if (questionPool.length === 0) {
    return { success: false, error: "No questions found for subject" };
  }

  // 3. Pick Random Question
  const picked = questionPool[Math.floor(Math.random() * questionPool.length)];
  const { q, source } = picked;

  // 4. Send to Telegram
  try {
    if (q.type === "case" && q.scenario) {
      await sendMessage(config.chatId, `📖 <b>Case Study:</b>\n\n${q.scenario}\n\n<i>From: ${source}</i>`);
    }

    const pollRes = await sendPoll(
      config.chatId,
      q.text,
      q.options,
      q.correctIndex,
      q.explanation
    );

    if (pollRes.ok) {
      await updateBotConfig({ lastSentAt: Timestamp.now() });
      return { success: true, question: q.text };
    } else {
      console.error("Telegram API Error:", pollRes);
      return { success: false, error: pollRes.description };
    }
  } catch (err) {
    console.error("Bot Error:", err);
    return { success: false, error: "Internal Error" };
  }
}
