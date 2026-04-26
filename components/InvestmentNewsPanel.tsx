"use client";

import { useCallback, useEffect, useState } from "react";
import { XP_SOURCES } from "@/src/config/xp";
import {
  HN_ARTICLE_READ_EVENT,
  getReadArticleObjectIds,
  markArticleObjectIdRead,
} from "@/src/lib/hnArticleRead";
import { postXpAward } from "@/src/lib/postXpAward";
import { readStoredPlayer, signInPlayer } from "@/src/lib/playerClient";

const HN_API =
  "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20";
const DAILY_XP_SESSION = "sagex.newsDailyXpAt";

type HNHit = {
  objectID: string;
  title: string | null;
  url: string | null;
  points?: number;
  author?: string | null;
};

let dailyNewsAwardInFlight = false;

function localDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type InvestmentNewsPanelProps = {
  onClose: () => void;
};

/**
 * Hacker News front page over the news playfield, plus one daily XP when stories load and the player is signed in.
 */
export function InvestmentNewsPanel({ onClose }: InvestmentNewsPanelProps) {
  const [hits, setHits] = useState<HNHit[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    getReadArticleObjectIds()
  );

  const syncReadFromStorage = useCallback(() => {
    setReadIds(getReadArticleObjectIds());
  }, []);

  useEffect(() => {
    syncReadFromStorage();
    window.addEventListener(HN_ARTICLE_READ_EVENT, syncReadFromStorage);
    return () =>
      window.removeEventListener(HN_ARTICLE_READ_EVENT, syncReadFromStorage);
  }, [syncReadFromStorage]);

  useEffect(() => {
    let cancel = false;
    fetch(HN_API)
      .then((r) => r.json())
      .then((data) => {
        if (cancel) return;
        setHits((data?.hits as HNHit[] | undefined) ?? []);
      })
      .catch(() => {
        if (!cancel) setLoadError("Could not load stories.");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  // Daily news XP: one grant per local calendar day (sourceRef `news-daily-YYYY-MM-DD`).
  // Not tied to individual articles — re-clicking / re-opening cannot farm XP. Server
  // enforces a unique (player, source, sourceRef) on XpEvent; duplicate responses get 0 XP.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading || hits.length === 0) return;
    const day = localDateKey();
    if (window.sessionStorage.getItem(DAILY_XP_SESSION) === day) return;
    if (dailyNewsAwardInFlight) return;

    dailyNewsAwardInFlight = true;
    void (async () => {
      try {
        const stored = readStoredPlayer();
        if (!stored) return;
        const authed = await signInPlayer(stored);
        const { ok } = await postXpAward({
          playerId: authed.playerId,
          name: authed.name,
          source: XP_SOURCES.DAILY_NEWS_READ,
          sourceRef: `news-daily-${day}`,
          metadata: { page: "investment" },
        });
        if (ok) {
          window.sessionStorage.setItem(DAILY_XP_SESSION, day);
        }
      } catch {
        // Non-fatal; no session write so a later visit can retry.
      } finally {
        dailyNewsAwardInFlight = false;
      }
    })();
  }, [loading, hits.length]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div
      className="font-sans flex h-full min-h-0 w-full min-w-0 flex-col text-[var(--foreground)]"
      aria-label="Hacker News front page"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-4">
        <div className="min-w-0">
          <p className="page-label">Live feed</p>
          <h2 className="page-title mt-1.5 text-2xl sm:text-3xl">Front page</h2>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Daily XP once per day. Open a link to mark a story read (✓).
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost min-h-0 shrink-0 self-start !h-9 px-4 py-0 text-sm"
        >
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
        {loading && (
          <p className="px-1 text-sm text-[var(--text-secondary)]">Loading…</p>
        )}
        {loadError && (
          <p className="px-1 text-sm text-rose-300/90">{loadError}</p>
        )}
        {!loading &&
          !loadError &&
          hits.map((hit, i) => {
            const read = readIds.has(hit.objectID);
            return (
              <a
                key={hit.objectID}
                href={hit.url ?? "https://news.ycombinator.com/"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  markArticleObjectIdRead(hit.objectID);
                }}
                className="glass-card glass-card-hover relative mb-3 block rounded-xl p-3 pr-10 text-left last:mb-0"
              >
                {read && (
                  <span
                    className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--sagex-accent)] bg-[var(--sagex-accent-muted)] text-xs font-bold text-[var(--sagex-accent)]"
                    title="Opened"
                    aria-label="You opened this story"
                  >
                    ✓
                  </span>
                )}
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {i + 1}.{" "}
                </span>
                <span className="text-sm font-medium leading-snug text-[var(--text-primary)]">
                  {hit.title}
                </span>
                {hit.points != null && (
                  <span className="mt-1.5 block text-xs text-[var(--text-muted)]">
                    {hit.points} pts
                    {hit.author ? ` · ${hit.author}` : ""}
                  </span>
                )}
              </a>
            );
          })}
      </div>
    </div>
  );
}
