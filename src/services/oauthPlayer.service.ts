import { PlayerRepository } from "../repositories/player.repo";
import type { PlayerProfile } from "../types/player";

/**
 * Links OAuth identity to a Player: existing auth row, email match, or new row.
 */
export async function findOrCreatePlayerForOAuth(opts: {
  provider: string;
  providerAccountId: string;
  email: string | null;
  name: string;
}): Promise<PlayerProfile> {
  const existingAuth = await PlayerRepository.findByAuthAccount(
    opts.provider,
    opts.providerAccountId
  );
  if (existingAuth) {
    const now = new Date();
    const patched = await PlayerRepository.patchStats(existingAuth.playerId, {
      lastActiveAt: now,
    });
    return (patched ?? existingAuth) as PlayerProfile;
  }

  if (opts.email) {
    const byEmail = await PlayerRepository.findByEmail(opts.email);
    if (byEmail) {
      await PlayerRepository.linkAuthAccount(byEmail.playerId, {
        email: opts.email,
        accountProvider: opts.provider,
        accountId: opts.providerAccountId,
      });
      const now = new Date();
      const patched = await PlayerRepository.patchStats(byEmail.playerId, {
        lastActiveAt: now,
      });
      const merged = await PlayerRepository.findById(byEmail.playerId);
      return (patched ?? merged ?? byEmail) as PlayerProfile;
    }
  }

  return PlayerRepository.createWithOAuth({
    provider: opts.provider,
    providerAccountId: opts.providerAccountId,
    email: opts.email,
    name: opts.name || "Pilot",
  });
}
