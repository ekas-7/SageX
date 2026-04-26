const DEV_INSECURE_SECRET = "sagex-dev-only-not-for-production";

/**
 * Secret used to sign/encrypt session cookies. Shared by `auth.ts` and
 * `middleware` (e.g. if using `getToken`); keep in sync.
 */
export function getAuthSecret(): string | undefined {
  const fromEnv =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[auth] AUTH_SECRET / NEXTAUTH_SECRET not set — using a dev-only default. Add AUTH_SECRET to .env.local for stable sessions and to match production."
    );
    return DEV_INSECURE_SECRET;
  }
  return undefined;
}
