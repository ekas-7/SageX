import { PlayerService } from "../services/player.service";
import type { PlayerProfileUpsertInput } from "../vali/player.vali";

export const PlayerOrchestrator = {
  /** Sign-in / profile upsert keyed by stable playerId. */
  async upsertProfile(payload: PlayerProfileUpsertInput) {
    return PlayerService.signIn(payload);
  },

  /**
   * Legacy rehydration: client only has a name from localStorage and
   * no playerId. We look up the first match by name, and if found, the
   * caller persists the returned playerId for future requests.
   */
  async rehydrateByName(name: string) {
    return PlayerService.rehydrateByName(name);
  },
};
