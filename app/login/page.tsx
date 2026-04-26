"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { OnboardingOAuthSection } from "@/components/OnboardingOAuthSection";

export default function LoginPage() {
  const router = useRouter();
  const [callsign, setCallsign] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const t = callsign.trim();
    if (!t || !password) {
      setError("Enter your callsign and password.");
      return;
    }
    setPending(true);
    try {
      const res = await signIn("credentials", {
        callsign: t,
        password,
        redirect: false,
        callbackUrl: "/hub",
      });
      if (res?.error) {
        setError(
          "Invalid callsign or password. If you signed up with Google or GitHub, use one of the buttons above."
        );
        return;
      }
      if (res?.ok) {
        router.push("/hub");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden overflow-y-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full min-h-[100dvh]">
        <video
          className="absolute inset-0 h-full w-full min-h-full min-w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assests/background/onboarding/hero.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] h-[100dvh] min-h-[100dvh] bg-black/45" />
      <div className="pointer-events-none fixed inset-0 z-[1] h-[100dvh] min-h-[100dvh] backdrop-blur-xs" />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-8 sm:px-6">
        <div className="text-center">
          <p className="page-label text-[0.7rem] sm:text-xs">SageX</p>
          <h1 className="page-title mt-2 text-2xl sm:text-3xl">Sign in</h1>
          <p className="page-description mt-1 text-sm text-[var(--text-secondary)]">
            Welcome back. Continue with a provider or your callsign and password.
          </p>
        </div>

        <div className="glass-card flex flex-col gap-4 rounded-2xl p-5 sm:p-6">
          <OnboardingOAuthSection
            callbackUrl="/hub"
            orDividerText="Or sign in with your callsign"
          />

          <form className="flex flex-col gap-3" onSubmit={handlePasswordSignIn}>
            <label className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]" htmlFor="login-callsign">
              <span className="font-display text-xs font-medium uppercase tracking-widest">
                Callsign
              </span>
              <input
                id="login-callsign"
                name="callsign"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                autoComplete="username"
                className="h-11 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--sagex-accent)]/30"
                placeholder="Your pilot name"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]" htmlFor="login-password">
              <span className="font-display text-xs font-medium uppercase tracking-widest">
                Password
              </span>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--sagex-accent)]/30"
                placeholder="Password"
              />
            </label>
            {error && (
              <p className="text-sm text-rose-300" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full disabled:cursor-wait disabled:opacity-80"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)]">
          New to SageX?{" "}
          <Link
            className="font-medium text-[var(--sagex-accent)] hover:underline"
            href="/onboarding"
          >
            Create a pilot
          </Link>
        </p>
      </main>
    </div>
  );
}
