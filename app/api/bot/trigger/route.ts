import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { triggerBotCron } from "@/lib/bot-service";

export async function POST(req: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Check role in Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await triggerBotCron();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Manual Bot Trigger Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
