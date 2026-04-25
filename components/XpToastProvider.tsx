"use client";

import { useCallback, useEffect, useState } from "react";
import {
  XP_TOAST_EVENT,
  type XpToastDetail,
} from "@/src/lib/xpToastEvents";

type Entry = { id: number; detail: XpToastDetail };

const DISPLAY_MS = 5200;
const MAX_STACK = 4;

export function XpToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Entry[]>([]);

  const pushToast = useCallback((detail: XpToastDetail) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const next = [...prev, { id, detail }];
      return next.length > MAX_STACK ? next.slice(-MAX_STACK) : next;
    });
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DISPLAY_MS);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<XpToastDetail>;
      const d = ce.detail;
      if (!d || typeof d.awarded !== "number" || d.awarded <= 0) return;
      pushToast(d);
    };
    window.addEventListener(XP_TOAST_EVENT, handler);
    return () => window.removeEventListener(XP_TOAST_EVENT, handler);
  }, [pushToast]);

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-0 z-[200] flex w-full max-w-sm flex-col gap-2 pl-4 pr-4 sm:left-auto sm:right-4 sm:max-w-sm sm:pl-0"
        aria-live="polite"
      >
        {toasts.map(({ id, detail }) => (
          <XpToastCard key={id} detail={detail} />
        ))}
      </div>
    </>
  );
}

function XpToastCard({ detail }: { detail: XpToastDetail }) {
  const mult =
    detail.multiplier != null && detail.multiplier > 1
      ? detail.multiplier.toFixed(2)
      : null;

  return (
    <div className="xp-toast-panel pointer-events-auto relative overflow-hidden rounded-xl border border-[var(--border-accent)] bg-[var(--surface-2)]/96 px-4 py-3 shadow-[0_0_0_1px_rgba(52,240,190,0.1),0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--sagex-accent-muted)]/40 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative font-sans">
        {detail.sourceLabel && (
          <p className="section-label mb-1 text-[var(--sagex-accent)] opacity-90">
            {detail.sourceLabel}
          </p>
        )}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <p className="font-display text-2xl font-semibold tabular-nums leading-tight text-[var(--sagex-accent)]">
            +{detail.awarded} XP
          </p>
          {mult && (
            <span className="text-xs font-medium text-[var(--text-muted)]">
              ×{mult}
            </span>
          )}
        </div>
        {detail.leveledUp && detail.levelAfter != null && (
          <p className="mt-1.5 text-sm text-[var(--text-primary)]">
            Level up · Lv {detail.levelAfter}
            {detail.rank ? ` · ${detail.rank}` : ""}
            {detail.levelsGained != null && detail.levelsGained > 1
              ? ` (+${detail.levelsGained} levels)`
              : ""}
          </p>
        )}
        {detail.softCapped && (
          <p className="mt-1 text-[0.625rem] uppercase tracking-wider text-[var(--text-muted)]">
            Daily soft cap — reduced gain
          </p>
        )}
      </div>
    </div>
  );
}
