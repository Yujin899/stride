import { adminDb, admin } from "./firebase/admin";
import { BotConfig, Question } from "@/types";
import { sendPoll, sendMessage } from "./telegram-service";

export async function getBotConfig(): Promise<BotConfig | null> {
  const snap = await adminDb.collection("botConfig").doc("current").get();
  if (snap.exists) {
    const data = snap.data() as BotConfig;
    return {
      ...data,
      isEnabled: data.isEnabled ?? true,
      intervalHours: data.intervalHours ?? 2,
    };
  }
  return null;
}

export async function updateBotConfig(data: Partial<BotConfig>) {
  const current = await getBotConfig();
  const newData = {
    id: "current",
    subjectId: data.subjectId || current?.subjectId || "random",
    chatId: data.chatId || current?.chatId || "",
    lastSentAt: data.lastSentAt || current?.lastSentAt,
    isEnabled: data.isEnabled !== undefined ? data.isEnabled : (current?.isEnabled ?? true),
    intervalHours: data.intervalHours || current?.intervalHours || 2,
  };
  await adminDb.collection("botConfig").doc("current").set(newData);
}

export async function triggerBotCron(force = false) {
  const config = await getBotConfig();
  if (!config || !config.chatId) {
    console.error("Bot not configured (missing chatId)");
    return { success: false, error: "Not configured" };
  }

  // Smart check for automation
  if (!force) {
    if (!config.isEnabled) {
      return { success: false, error: "Auto-pilot is disabled" };
    }
    
    if (config.lastSentAt && config.intervalHours) {
      const lastSent = config.lastSentAt.toDate();
      const nextAllowed = new Date(lastSent.getTime() + config.intervalHours * 3600 * 1000);
      const now = new Date();
      
      if (now < nextAllowed) {
        const remainingMin = Math.ceil((nextAllowed.getTime() - now.getTime()) / 60000);
        return { 
          success: false, 
          error: `Interval not reached. Next in ${remainingMin} mins.`,
          isSkipped: true 
        };
      }
    }
  }

  // 1. Determine Subject
  let subjectId = config.subjectId;
  if (subjectId === "random") {
    const subs = await adminDb.collection("subjects").get();
    if (!subs.empty) {
      const randomSub = subs.docs[Math.floor(Math.random() * subs.docs.length)];
      subjectId = randomSub.id;
    }
  }

  // 2. Fetch Questions (Mistakes first)
  const questionPool: { q: Question; source: string }[] = [];

  // Fallback: Fetch all lectures for this subject
  const lecturesSnap = await adminDb.collection("lectures").where("subjectId", "==", subjectId).get();
  lecturesSnap.forEach(doc => {
    const lecture = doc.data();
    if (lecture.questions && Array.isArray(lecture.questions)) {
      lecture.questions.forEach((q: Question) => {
        questionPool.push({ q, source: lecture.title || `Lecture ${lecture.order}` });
      });
    }
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
      // Update lastSentAt ONLY on success
      await updateBotConfig({ lastSentAt: admin.firestore.Timestamp.now() as any });
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
