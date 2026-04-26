import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthSecret } from "@/src/lib/authEnv";
import { isPathPublic } from "@/src/lib/protectedRoutes";

/**
 * Edge-safe route protection. Does not import `auth.ts` (avoids Node/Mongo in the Edge bundle).
 * Public paths: `src/lib/protectedRoutes`. All other non-static page routes need a valid session cookie.
 * API routes are not matched; protect APIs inside each `route.ts` with `auth()`.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPathPublic(pathname)) {
    return NextResponse.next();
  }
  const secret = getAuthSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "AUTH_SECRET is not configured" },
      { status: 500 }
    );
  }
  const token = await getToken({
    req: request,
    secret,
    secureCookie: request.nextUrl.protocol === "https:",
  });
  if (!token) {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/|_vercel|favicon|.*\\..*).*)"],
};
