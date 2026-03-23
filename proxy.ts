import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";

const SESSION_COOKIE_NAME = "stride_session";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Google's public keys for Firebase Auth ID tokens
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtectedPath = 
    pathname.startsWith("/home") || 
    pathname.startsWith("/study") || 
    pathname.startsWith("/quiz") || 
    pathname.startsWith("/mistakes");
    
  const isAdminPath = pathname.startsWith("/admin");

  // 1. Auth check
  if (isProtectedPath || isAdminPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      // 2. CRYPTOGRAPHIC VERIFICATION
      // Ensures the token is a valid Firebase-issued token for OUR project
      await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
      });

      // 3. Role check for admin paths
      if (isAdminPath) {
        const decoded = decodeJwt(token);
        console.log("Proxy: Decoded Role =", decoded.role, "UID =", decoded.sub);
        if (decoded.role !== "admin") {
          console.warn("Proxy: Non-admin trying to access admin path. Redirecting to /home");
          return NextResponse.redirect(new URL("/home", req.url));
        }
      }
    } catch (error) {
      console.error("Proxy Auth Error:", error);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 4. Redirect logged-in users away from /login
  if (pathname === "/login" && token) {
    try {
      await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
      });
      return NextResponse.redirect(new URL("/home", req.url));
    } catch {
      // Token invalid, allow /login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/study/:path*",
    "/quiz/:path*",
    "/mistakes/:path*",
    "/admin/:path*",
    "/login",
  ],
};
