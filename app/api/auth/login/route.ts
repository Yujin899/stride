import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth/services";

export async function POST(req: Request) {
  try {
    const { name, pin } = await req.json();
    if (!name || !pin) return NextResponse.json({ error: "Name and PIN required" }, { status: 400 });
    const data = await loginUser(name, pin);
    // Session cookie will be set by /api/auth/session after client exchanges customToken for idToken
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
