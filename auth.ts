import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { verifyPassword } from "@/src/lib/passwordHash";
import { PlayerRepository } from "@/src/repositories/player.repo";
import { findOrCreatePlayerForOAuth } from "@/src/services/oauthPlayer.service";

function oauthAvatar(
  profile: unknown,
  user: { image?: string | null }
): string | undefined {
  const p = profile as { picture?: string; avatar_url?: string };
  return p.picture ?? p.avatar_url ?? user.image ?? undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
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
      if (account && profile) {
        const provider = account.provider;
        const providerAccountId = account.providerAccountId;
        const email =
          (typeof profile.email === "string" && profile.email) ||
          (typeof user.email === "string" && user.email) ||
          null;
        const name =
          (typeof profile.name === "string" && profile.name) ||
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
