import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      playerId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    playerId?: string;
    name?: string;
    picture?: string;
  }
}
