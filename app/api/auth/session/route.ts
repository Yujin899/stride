import { NextResponse } from "next/server";
import { setSessionCookie, removeSessionCookie, encryptSession } from "@/lib/auth/session";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * Handles setting and removing the session cookie via ID Token exchange.
 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "ID Token required" }, { status: 400 });
    }

    // 1. Verify the Firebase ID Token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // 2. Create our own long-lived session token (5 days)
    const sessionToken = await encryptSession({
      sub: decodedToken.uid, // Subject is UID
      role: decodedToken.role || "user",
      name: decodedToken.name || decodedToken.email,
    });

    // 3. Set the cookie
    await setSessionCookie(sessionToken);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  await removeSessionCookie();
  return NextResponse.json({ success: true });
}
