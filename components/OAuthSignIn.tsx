"use client";

import { signIn } from "next-auth/react";

type OAuthSignInProps = {
  callbackUrl?: string;
  className?: string;
};

export function OAuthSignIn({
  callbackUrl = "/hub",
  className = "",
}: OAuthSignInProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-center text-xs text-[var(--text-muted)]">
        Or continue with
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="btn-ghost h-11 text-sm"
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="btn-ghost h-11 text-sm"
        >
          GitHub
        </button>
      </div>
    </div>
  );
}
