import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { getAuthSecret } from "@/src/lib/authEnv";

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

const authSecret = getAuthSecret();

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  pages: {
    signIn: "/login",
  },
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
        const [{ verifyPassword }, { PlayerRepository }] = await Promise.all([
          import("@/src/lib/passwordHash"),
          import("@/src/repositories/player.repo"),
        ]);
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
        token.name = user.name ?? undefined;
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
        const { findOrCreatePlayerForOAuth } = await import(
          "@/src/services/oauthPlayer.service"
        );
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
