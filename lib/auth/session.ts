import { cookies } from "next/headers";
import { SignJWT, jwtVerify, JWTPayload } from "jose";

const SESSION_COOKIE_NAME = "stride_session";
const secretKey = process.env.AUTH_SECRET || "fallback_secret_do_not_use_in_prod";
const key = new TextEncoder().encode(secretKey);

export async function encryptSession(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5d")
    .sign(key);
}

export async function decryptSession(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

/**
 * Set the session cookie after successful login.
 */
export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Better for cross-page navigation redirections
    maxAge: 60 * 60 * 24 * 5, // 5 days
    path: "/",
  });
}

/**
 * Remove the session cookie on logout.
 */
export async function removeSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

/**
 * Get the session token from cookies.
 */
export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}
