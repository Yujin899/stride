import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, decryptSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { notifyNewLecture } from "@/lib/bot-service";

export async function POST(req: NextRequest) {
  try {
    const cookieToken = await getSessionToken();
    const authHeader = req.headers.get("authorization");
    const token = cookieToken || authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await decryptSession(token);
    const userId = decoded.sub as string;
    
    if (!userId) {
      return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
    }

    // Check role in Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lectureTitle, subjectId, quizTitle } = await req.json();
    
    if (!lectureTitle || !subjectId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const result = await notifyNewLecture(lectureTitle, subjectId, quizTitle);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Notify API Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
