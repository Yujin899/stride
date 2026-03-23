import { NextResponse } from "next/server";
import { removeSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 */
export async function POST() {
  await removeSessionCookie();
  return NextResponse.json({ success: true });
}
