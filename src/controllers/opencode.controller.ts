import { AiService } from "../services/ai.service";
import { PlayerRepository } from "../repositories/player.repo";
import { XpService } from "../services/xp.service";
import { opencodeAdviseSchema } from "../vali/opencode.vali";

export const OpencodeController = {
  async advise(request: Request) {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = opencodeAdviseSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues.map((i) => i.message).join("; ") ||
          "Invalid advise payload"
      );
    }

    let context: {
      playerName?: string;
      level?: number;
      rank?: string;
      focus?: string;
    } | undefined;

    if (parsed.data.playerId) {
      const player = await PlayerRepository.findById(parsed.data.playerId);
      if (player) {
        const snap = XpService.levelSnapshot(player.stats?.totalXp ?? 0);
        context = {
          playerName: player.name,
          level: snap.level,
          rank: snap.rank,
          focus: player.interests?.join(", "),
        };
      }
    } else if (parsed.data.playerName) {
      context = { playerName: parsed.data.playerName };
    }

    const advice = await AiService.opencodeAdvise({
      query: parsed.data.query,
      context,
    });

    if (!advice) {
      throw new Error(
        "OpenCode advisor is offline. Check GROQ_API_KEY on the server."
      );
    }

    return { ok: true, advice };
  },
};
