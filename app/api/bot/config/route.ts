import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getBotConfig, updateBotConfig } from "@/lib/bot-service";

/**
 * Verify if the request is from an authenticated Admin
 */
async function verifyAdmin() {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (userDoc.exists && userDoc.data()?.role === "admin") {
      return userId;
    }
  } catch (err) {
    console.error("Admin verify error:", err);
  }
  return null;
}

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const config = await getBotConfig();
    return NextResponse.json(config);
  } catch (_err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    await updateBotConfig(data);
    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
