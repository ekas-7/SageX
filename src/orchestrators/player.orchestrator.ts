import { PlayerService } from "../services/player.service";
import type { PlayerProfileInput } from "../vali/player.vali";

export const PlayerOrchestrator = {
  async upsertProfile(payload: PlayerProfileInput) {
    return PlayerService.getOrCreatePlayer(payload);
  },
};
