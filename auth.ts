import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
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
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
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
