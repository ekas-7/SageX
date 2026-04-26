import { NextResponse } from "next/server";

type OAuthStatus = "ok" | "missing_id" | "missing_secret" | "missing_both";

/**
 * Safe production checks for OAuth env (no secret values, no client IDs in response).
 * Use on Vercel: GET https://yoursite.com/api/health/auth
 *
 * `githubOauth` / `googleOauth`: "ok" if both id+secret are non-empty, else which part is missing.
 */
export async function GET() {
  const ghId =
    !!process.env.AUTH_GITHUB_ID?.trim() ||
    !!process.env.GITHUB_ID?.trim() ||
    !!process.env.GITHUB_CLIENT_ID?.trim();
  const ghSec =
    !!process.env.AUTH_GITHUB_SECRET?.trim() ||
    !!process.env.GITHUB_SECRET?.trim() ||
    !!process.env.GITHUB_CLIENT_SECRET?.trim();
  let githubOauth: OAuthStatus;
  if (ghId && ghSec) githubOauth = "ok";
  else if (!ghId && !ghSec) githubOauth = "missing_both";
  else if (!ghId) githubOauth = "missing_id";
  else githubOauth = "missing_secret";

  const gId =
    !!process.env.AUTH_GOOGLE_ID?.trim() ||
    !!process.env.GOOGLE_CLIENT_ID?.trim();
  const gSec =
    !!process.env.AUTH_GOOGLE_SECRET?.trim() ||
    !!process.env.GOOGLE_CLIENT_SECRET?.trim();
  let googleOauth: OAuthStatus;
  if (gId && gSec) googleOauth = "ok";
  else if (!gId && !gSec) googleOauth = "missing_both";
  else if (!gId) googleOauth = "missing_id";
  else googleOauth = "missing_secret";

  const authUrl =
    !!process.env.AUTH_URL?.trim() || !!process.env.NEXTAUTH_URL?.trim();
  const authSecret =
    !!process.env.AUTH_SECRET?.trim() || !!process.env.NEXTAUTH_SECRET?.trim();
  const mongo = !!process.env.MONGODB_URI?.trim();

  return NextResponse.json({
    ok: githubOauth === "ok" && authSecret && mongo,
    githubOauth,
    googleOauth,
    authUrl,
    authSecret,
    mongo,
    expectedGitHubCallbackPath: "/api/auth/callback/github",
  });
}
