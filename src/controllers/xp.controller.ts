import { XpOrchestrator } from "../orchestrators/xp.orchestrator";
import {
  xpAwardSchema,
  xpSummaryQuerySchema,
  type XpAwardBody,
} from "../vali/xp.vali";
import type { Difficulty, XpSource } from "../config/xp";

export const XpController = {
  async award(request: Request) {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = xpAwardSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message).join("; ");
      throw new Error(`Invalid XP award payload: ${issues}`);
    }
    const data = parsed.data as XpAwardBody;
    const result = await XpOrchestrator.award({
      playerId: data.playerId,
      name: data.name,
      source: data.source as XpSource,
      sourceRef: data.sourceRef,
      difficulty: data.difficulty as Difficulty | undefined,
      overrideBase: data.overrideBase,
      metadata: data.metadata,
    });
    return { ok: true, ...result };
  },

  async summary(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = xpSummaryQuerySchema.safeParse({
      playerId: searchParams.get("playerId") ?? "",
    });
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message).join("; ");
      throw new Error(`Invalid summary query: ${issues}`);
    }
    const summary = await XpOrchestrator.getSummary(parsed.data.playerId);
    return { ok: true, summary };
  },
};
