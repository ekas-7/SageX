import { XP_SOURCES } from "@/src/config/xp";
import type { XpAwardBody } from "@/src/vali/xp.vali";
import { emitXpToast } from "@/src/lib/xpToastEvents";
import type { XpAwardResult } from "@/src/types/xp";

const TOAST_LABEL: Record<string, string> = {
  [XP_SOURCES.QUEST_COMPLETE]: "Quest complete",
  [XP_SOURCES.QUEST_PERFECT]: "Perfect quest",
  [XP_SOURCES.ETHICS_SCENARIO]: "Ethics",
  [XP_SOURCES.ETHICS_SCENARIO_PARTIAL]: "Ethics",
  [XP_SOURCES.VIBE_SUBMIT]: "Vibe",
  [XP_SOURCES.VIBE_VOTE_RECEIVED]: "Vibe upvote",
  [XP_SOURCES.DAILY_LOGIN]: "Daily login",
  [XP_SOURCES.DAILY_NEWS_READ]: "Daily news",
  [XP_SOURCES.STREAK_MILESTONE]: "Streak",
  [XP_SOURCES.ONBOARDING_COMPLETE]: "Onboarding",
  [XP_SOURCES.FIELD_TRACK_STEP]: "Field track",
  [XP_SOURCES.SIDE_QUEST]: "Side quest",
  [XP_SOURCES.ARENA_SOLVED]: "Arena",
  [XP_SOURCES.ARENA_PARTIAL]: "Arena",
  [XP_SOURCES.MANUAL_GRANT]: "Bonus XP",
};

type AwardResponse = { ok?: boolean; error?: string } & Partial<XpAwardResult>;

/**
 * POST `/api/xp/award` and fire the global XP toast on a real grant.
 * Duplicate / idempotent responses (same player + source + sourceRef) have `ok: true`
 * and `duplicate: true`, `awarded: 0` — the DB unique index prevents double-grants.
 */
export async function postXpAward(
  body: XpAwardBody
): Promise<{ ok: boolean; payload: AwardResponse }> {
  const res = await fetch("/api/xp/award", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json()) as AwardResponse;
  const ok = res.ok && payload?.ok === true;
  if (
    ok &&
    !payload.duplicate &&
    typeof payload.awarded === "number" &&
    payload.awarded > 0
  ) {
    emitXpToast({
      awarded: payload.awarded,
      leveledUp: payload.leveledUp,
      levelsGained: payload.levelsGained,
      levelAfter: payload.levelAfter,
      rank: payload.rank,
      softCapped: payload.softCapped,
      multiplier: payload.multiplier,
      sourceLabel: TOAST_LABEL[body.source] ?? body.source,
    });
  }
  return { ok, payload };
}
