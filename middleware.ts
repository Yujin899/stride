import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "stride_session";
const secretKey = process.env.AUTH_SECRET || "fallback_secret_do_not_use_in_prod";
const key = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtectedPath = 
    pathname.startsWith("/home") || 
    pathname.startsWith("/study") || 
    pathname.startsWith("/quiz") || 
    pathname.startsWith("/mistakes") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/pomodoro");
    
  const isAdminPath = pathname.startsWith("/admin");

  // 1. Auth check
  if (isProtectedPath || isAdminPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      // 2. VERIFY OUR CUSTOM SIGNED JWT
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["HS256"],
      });

      // 3. Role check for admin paths
      if (isAdminPath) {
        if (payload.role !== "admin") {
          console.warn("Middleware: Non-admin trying to access admin path. Redirecting to /home");
          return NextResponse.redirect(new URL("/home", req.url));
        }
      }
    } catch (error) {
      console.error("Middleware Auth Error:", error);
      // Clear invalid cookie and redirect
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  // 4. Redirect logged-in users away from /login or /register
  if ((pathname === "/login" || pathname === "/register") && token) {
    try {
      await jwtVerify(token, key, {
        algorithms: ["HS256"],
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sounds (public sound files)
     * - clock.png, ad-1.png, tomato.png (public images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sounds|.*\\.png$).*)",
  ],
};
