import { PlayerService } from "../services/player.service";

export const PlayerController = {
  async getStats(request: Request) {
    const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const avatarValue = searchParams.get("avatar");
  const skillValue = searchParams.get("skill");
    const interestsValue = searchParams.get("interests");
  const avatar = avatarValue && avatarValue.length > 0 ? avatarValue : undefined;
  const skill = skillValue && skillValue.length > 0 ? skillValue : undefined;
    const interests = interestsValue
      ? interestsValue
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined;

    if (!name) {
      throw new Error("Player name is required");
    }

    const player = await PlayerService.getOrCreatePlayer({
      name,
      avatar,
      skill,
      interests,
    });
    const { leaderboard, rank } = await PlayerService.getLeaderboard(player);

    return {
      player: {
        ...player,
        rank,
      },
      leaderboard,
    };
  },

  async updateStats(request: Request) {
    const body = (await request.json()) as {
      name?: string;
      deltaChallenges?: number;
      deltaXp?: number;
    };

    if (!body?.name) {
      throw new Error("Player name is required");
    }

    const player = await PlayerService.updateStats({
      name: body.name,
      deltaChallenges: body.deltaChallenges,
      deltaXp: body.deltaXp,
    });
    const { leaderboard, rank } = await PlayerService.getLeaderboard(player);

    return {
      player: {
        ...player,
        rank,
      },
      leaderboard,
    };
  },
};
