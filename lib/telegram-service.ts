const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: string, text: string) {
  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  });
  return res.json();
}

export async function sendPoll(
  chatId: string, 
  question: string, 
  options: string[], 
  correctIndex: number, 
  explanation?: string
) {
  const res = await fetch(`${BASE_URL}/sendPoll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      question: question.length > 300 ? question.substring(0, 297) + "..." : question,
      options: options.map(o => o.length > 100 ? o.substring(0, 97) + "..." : o),
      is_anonymous: false,
      type: "quiz",
      correct_option_id: correctIndex,
      explanation: explanation ? (explanation.length > 200 ? explanation.substring(0, 197) + "..." : explanation) : undefined,
    }),
  });
  return res.json();
}
