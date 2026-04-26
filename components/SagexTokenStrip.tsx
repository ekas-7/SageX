"use client";

import { useEffect, useMemo, useState } from "react";
import { getSagexTokenPublic, type SagexTokenPublic } from "@/src/config/sagexToken";

type Variant = "home" | "hub";

const externalLink = {
  target: "_blank" as const,
  rel: "noopener noreferrer" as const,
};

function useTokenQuote(mint: string | null) {
  const [priceUsd, setPriceUsd] = useState<number | null | undefined>(undefined);
  const [symbol, setSymbol] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!mint) {
      return;
    }
    let cancelled = false;
    const u = new URL("/api/token/quote", window.location.origin);
    u.searchParams.set("mint", mint);
    void fetch(u.toString())
      .then((r) => r.json() as Promise<{ priceUsd?: number | null; symbol?: string }>)
      .then((j) => {
        if (cancelled) return;
        const p = j?.priceUsd;
        setPriceUsd(
          p == null || Number.isNaN(p) || !Number.isFinite(p) ? null : p
        );
        if (typeof j?.symbol === "string" && j.symbol.length > 0) {
          setSymbol(j.symbol);
        }
      })
      .catch(() => {
        if (!cancelled) setPriceUsd(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mint]);

  return { priceUsd, symbol };
}

function formatUsd(n: number): string {
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

type SagexTokenStripProps = { variant: Variant; className?: string };

function LinkRow({ cfg }: { cfg: SagexTokenPublic }) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {cfg.pumpUrl ? (
        <a
          href={cfg.pumpUrl}
          {...externalLink}
          className="inline-flex h-8 items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-2)] px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-hover)]"
        >
          Buy on pump.fun
        </a>
      ) : null}
      {cfg.dexScreenerUrl ? (
        <a
          href={cfg.dexScreenerUrl}
          {...externalLink}
          className="text-xs font-semibold text-[var(--sagex-accent)] underline-offset-2 hover:underline"
        >
          Chart
        </a>
      ) : null}
      {cfg.solscanUrl ? (
        <a
          href={cfg.solscanUrl}
          {...externalLink}
          className="text-xs font-semibold text-[var(--sagex-accent)] underline-offset-2 hover:underline"
        >
          Solscan
        </a>
      ) : null}
    </div>
  );
}

export function SagexTokenStrip({ variant, className = "" }: SagexTokenStripProps) {
  const cfg = useMemo(() => getSagexTokenPublic(), []);
  const { priceUsd, symbol } = useTokenQuote(cfg.mint);

  if (!cfg.isConfigured) {
    if (process.env.NODE_ENV === "development") {
      return (
        <p
          className={
            variant === "home"
              ? `text-xs text-white/50 ${className}`.trim()
              : `text-xs text-[var(--text-muted)] ${className}`.trim()
          }
        >
          SAGEX token: set <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_SAGEX_TOKEN_MINT</code>{" "}
          or link overrides in <code className="rounded bg-white/10 px-1">.env.local</code>
        </p>
      );
    }
    return null;
  }

  const titleClass =
    variant === "home"
      ? "section-label text-white/80"
      : "section-label text-[var(--text-secondary)]";
  const bodyClass =
    variant === "home" ? "text-sm text-white/90" : "text-sm text-[var(--text-secondary)]";
  const cardClass = "glass-card rounded-2xl p-4 sm:p-5";
  const priceTextClass =
    variant === "home" ? "text-xs text-white/70" : "text-xs text-[var(--text-muted)]";

  return (
    <div className={`${cardClass} ${className}`.trim()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={titleClass}>
            {cfg.label}
            {symbol ? <span className="ml-1 opacity-80">({symbol})</span> : null}
          </p>
          <p className={bodyClass}>
            Community token on Solana — not financial advice; links open in a new tab.
          </p>
          {cfg.mint && priceUsd !== undefined ? (
            <p className={priceTextClass}>
              {priceUsd != null
                ? `Last ~$${formatUsd(priceUsd)} USD (via DexScreener, indicative)`
                : "Live price unavailable — use Chart for the latest."}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <LinkRow cfg={cfg} />
        </div>
      </div>
    </div>
  );
}
