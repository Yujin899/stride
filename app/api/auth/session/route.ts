import { NextResponse } from "next/server";
import { setSessionCookie, removeSessionCookie } from "@/lib/auth/session";

/**
 * Handles setting and removing the session cookie via ID Token exchange.
 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "ID Token required" }, { status: 400 });
    }

    await setSessionCookie(idToken);
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
