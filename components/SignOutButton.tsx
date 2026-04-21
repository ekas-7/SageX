"use client";

import { signOut, useSession } from "next-auth/react";

export function SignOutButton() {
  const { data: session } = useSession();
  if (!session) return null;
  return (
    <button
      type="button"
      className="btn-ghost text-xs"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("sagex.player");
          window.localStorage.removeItem("sagex.playerId");
        }
        void signOut({ callbackUrl: "/" });
      }}
    >
      Sign out
    </button>
  );
}
