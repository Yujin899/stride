import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { triggerBotCron } from "@/lib/bot-service";

export async function POST(_req: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      console.error("Bot Trigger: No session token found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Bot Trigger: Verifying token...");
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    console.log("Bot Trigger: Token verified for UID", userId);

    // Check role in Firestore
    console.log("Bot Trigger: Checking admin role...");
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.error("Bot Trigger: User doc not found for UID", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userDoc.data();
    console.log("Bot Trigger: User role is", userData?.role);

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Bot Trigger: Invoking triggerBotCron...");
    const result = await triggerBotCron(true);
    console.log("Bot Trigger: Result", result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Manual Bot Trigger Error:", err);
    // Provide more detail if possible in the response for debugging (temporary)
    return NextResponse.json({ 
      error: "Internal Error", 
      message: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}
