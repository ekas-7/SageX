/**
 * UI-only: which HN story links the player opened. Does not call `/api/xp/award` and
 * cannot grant XP — daily news XP is a separate once-per-day award by `sourceRef`.
 */
const KEY = "sagex.hnReadObjectIds";
const MAX_IDS = 2000;

export const HN_ARTICLE_READ_EVENT = "sagex-hn-article-read" as const;

function parseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const a = JSON.parse(raw) as unknown;
    return Array.isArray(a)
      ? a.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function getReadArticleObjectIds(): Set<string> {
  return new Set(parseIds());
}

export function isArticleObjectIdRead(id: string): boolean {
  return getReadArticleObjectIds().has(id);
}

export function markArticleObjectIdRead(id: string): void {
  if (typeof window === "undefined" || !id) return;
  const current = parseIds();
  if (current.includes(id)) return;
  const next = [...current, id];
  const trimmed =
    next.length > MAX_IDS ? next.slice(-MAX_IDS) : next;
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new Event(HN_ARTICLE_READ_EVENT));
}
