import { NextRequest, NextResponse } from "next/server";
import { triggerBotCron } from "@/lib/bot-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await triggerBotCron();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Cron Route Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
