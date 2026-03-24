import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { triggerBotCron } from "@/lib/bot-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const source = req.headers.get("X-Stride-Source");

  if (!key || key !== process.env.CRON_SECRET) {
    console.warn("Unauthorized Cron Attempt: Invalid Key");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: Check source if in production
  if (process.env.NODE_ENV === "production" && source !== "github-action") {
    console.warn("Unauthorized Cron Attempt: Invalid Source Header");
    // We don't block yet, just log for safety, or we can block if desired
    // return NextResponse.json({ error: "Invalid Source" }, { status: 403 });
  }

  try {
    console.log("Cron Heartbeat: Triggering Oracle bot...");
    const result = await triggerBotCron();
    console.log("Cron Heartbeat Result:", result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Cron Route Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
