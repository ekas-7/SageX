import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { verifyPassword } from "@/src/lib/passwordHash";
import { PlayerRepository } from "@/src/repositories/player.repo";
import { findOrCreatePlayerForOAuth } from "@/src/services/oauthPlayer.service";

/**
 * Auth.js requires a non-empty `secret` for cookies/JWT. If unset, every auth
 * route returns error=Configuration ("problem with the server configuration").
 * Production: set `AUTH_SECRET` (or `NEXTAUTH_SECRET`) in the environment.
 * Local: we fall back in development only so the app works without a filled `.env`.
 */
const DEV_INSECURE_SECRET = "sagex-dev-only-not-for-production";

/**
 * @returns A secret to pass into NextAuth, or `undefined` so `setEnvDefaults`
 * can still read `AUTH_SECRET` from the environment (only when we do not
 * return a value here). Never return an empty string — that would block env merge.
 */
function resolveAuthSecret(): string | undefined {
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

/**
 * Support both Auth.js v5 names (AUTH_*_ID) and common legacy names
 * (GOOGLE_CLIENT_ID, GITHUB_ID, etc.) so OAuth works across environments.
 */
const googleOAuth = {
  clientId:
    process.env.AUTH_GOOGLE_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    undefined,
  clientSecret:
    process.env.AUTH_GOOGLE_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    undefined,
};

const githubOAuth = {
  clientId:
    process.env.AUTH_GITHUB_ID?.trim() ||
    process.env.GITHUB_ID?.trim() ||
    process.env.GITHUB_CLIENT_ID?.trim() ||
    undefined,
  clientSecret:
    process.env.AUTH_GITHUB_SECRET?.trim() ||
    process.env.GITHUB_SECRET?.trim() ||
    process.env.GITHUB_CLIENT_SECRET?.trim() ||
    undefined,
};

function oauthAvatar(
  profile: unknown,
  user: { image?: string | null }
): string | undefined {
  if (profile && typeof profile === "object") {
    const p = profile as { picture?: string; avatar_url?: string };
    return p.picture ?? p.avatar_url ?? user.image ?? undefined;
  }
  return user.image ?? undefined;
}

const authSecret = resolveAuthSecret();

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  ...(authSecret ? { secret: authSecret } : {}),
  providers: [
    Google({
      ...googleOAuth,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      ...githubOAuth,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "credentials",
      name: "Callsign",
      credentials: {
        callsign: { label: "Callsign" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.callsign || !credentials?.password) return null;
        const callsign = String(credentials.callsign).trim();
        const password = String(credentials.password);
        if (!callsign) return null;
        const player =
          await PlayerRepository.findByCallsignForPasswordAuth(callsign);
        if (!player?.passwordHash) return null;
        const ok = await verifyPassword(password, player.passwordHash);
        if (!ok) return null;
        return {
          id: player.playerId,
          name: player.name,
          image: player.avatar ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user && account && account.provider === "credentials") {
        token.playerId = user.id;
        token.name = user.name;
        if (user.image) {
          token.picture = user.image;
        }
        return token;
      }
      if (
        user &&
        account &&
        account.provider !== "credentials" &&
        account.provider !== "webauthn"
      ) {
        const provider = account.provider;
        const providerAccountId = account.providerAccountId;
        const prof = profile as { email?: string; name?: string } | undefined;
        const email =
          (typeof prof?.email === "string" && prof.email) ||
          (typeof user.email === "string" && user.email) ||
          null;
        const name =
          (typeof prof?.name === "string" && prof.name) ||
          (typeof user.name === "string" && user.name) ||
          "Pilot";
        const image = oauthAvatar(profile, user);
        const player = await findOrCreatePlayerForOAuth({
          provider,
          providerAccountId,
          email,
          name: name || "Pilot",
          image,
        });
        token.playerId = player.playerId;
        token.name = player.name;
        token.picture = player.avatar ?? image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.playerId) {
          session.user.playerId = token.playerId as string;
        }
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
