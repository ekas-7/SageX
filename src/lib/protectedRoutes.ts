/**
 * Pathnames that do not require a session (used by `callbacks.authorized` in auth.ts).
 * Everything else matched by `middleware` must have a valid login.
 */
const PUBLIC_EXACT = new Set<string>([
  "/",
  "/login",
  "/investment",
  "/ethics",
  "/map",
]);

const PUBLIC_PREFIXES: string[] = [
  "/onboarding", // sign-up + guide
  "/vibe/embed/", // iframes / shared embeds
  "/vibe/preview/",
];

/**
 * @param pathname - `URL.pathname` (leading slash, no query)
 */
export function isPathPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
  }
  return false;
}
