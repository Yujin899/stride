import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/services";

export async function POST(req: Request) {
  try {
    const { name, pin } = await req.json();
    if (!name || !pin || pin.length !== 4) {
      return NextResponse.json({ error: "Invalid name or PIN" }, { status: 400 });
    }
    const user = await registerUser(name, pin);
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
