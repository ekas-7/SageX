import { randomUUID } from "crypto";
import { PlayerModel } from "../models/player.model";
import { connectToDatabase } from "../lib/db";
import type { PlayerProfile } from "../types/player";

type CreateData = {
  playerId: string;
  name: string;
  avatar?: string;
  skill?: string;
  interests?: string[];
};

type UpsertData = CreateData & {
  /** Pre-hashed server-side; never set from the client. */
  passwordHash?: string;
};

const defaultStats = () => ({
  dailyStreak: 1,
  challengesCompleted: 0,
  totalChallenges: 0,
  totalXp: 0,
  level: 1,
  currentLevelXp: 0,
  xpToNext: 100,
  dailyXpEarned: 0,
  dailyXpResetAt: new Date(),
  milestonesClaimed: [],
  lastActiveAt: new Date(),
  lastStreakDate: new Date(),
});

export const PlayerRepository = {
  async findById(playerId: string) {
    await connectToDatabase();
    return PlayerModel.findOne({ playerId }).lean() as unknown as PlayerProfile | null;
  },

  /**
   * Legacy: lookup by name only (exact string). Returns the **first** match.
   * Display names are unique case-insensitively for new signups; old data may
   * still have duplicates — use `aggregateDuplicateNameReport` to audit.
   */
  async findByName(name: string) {
    await connectToDatabase();
    return PlayerModel.findOne({ name }).lean() as unknown as PlayerProfile | null;
  },

  async findByEmail(email: string) {
    await connectToDatabase();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    return PlayerModel.findOne({ email: normalized }).lean() as unknown as PlayerProfile | null;
  },

  async findByAuthAccount(provider: string, accountId: string) {
    await connectToDatabase();
    return PlayerModel.findOne({ accountProvider: provider, accountId }).lean() as unknown as PlayerProfile | null;
  },

  async linkAuthAccount(
    playerId: string,
    fields: { email?: string; accountProvider: string; accountId: string }
  ) {
    await connectToDatabase();
    const set: Record<string, string> = {
      accountProvider: fields.accountProvider,
      accountId: fields.accountId,
    };
    if (fields.email) set.email = fields.email.trim().toLowerCase();
    return PlayerModel.findOneAndUpdate({ playerId }, { $set: set }, { new: true }).lean() as unknown as PlayerProfile | null;
  },

  async createWithOAuth(data: {
    provider: string;
    providerAccountId: string;
    email: string | null;
    name: string;
    image?: string;
  }) {
    await connectToDatabase();
    const playerId = randomUUID();
    const doc = await PlayerModel.create({
      playerId,
      name: data.name.slice(0, 80),
      email: data.email ? data.email.trim().toLowerCase() : undefined,
      accountProvider: data.provider,
      accountId: data.providerAccountId,
      avatar: data.image,
      interests: [],
      stats: defaultStats(),
    });
    return doc.toObject() as unknown as PlayerProfile;
  },

  async create(data: CreateData) {
    await connectToDatabase();
    return PlayerModel.create({
      playerId: data.playerId,
      name: data.name,
      avatar: data.avatar,
      skill: data.skill,
      interests: data.interests ?? [],
      stats: defaultStats(),
    });
  },

  /**
   * Atomic upsert keyed by playerId. Creates if missing, otherwise only
   * updates the provided profile fields. Stats are never overwritten here.
   *
   * IMPORTANT: MongoDB forbids setting a nested path (`stats.lastActiveAt`)
   * and its parent (`stats`) in the same update. We therefore split the
   * operation in two: one upsert for profile fields, one patch for stats.
   */
  async upsertById(data: UpsertData) {
    await connectToDatabase();
    const now = new Date();
    const profileSet: Record<string, unknown> = {
      playerId: data.playerId,
      name: data.name,
    };
    if (data.avatar !== undefined) profileSet.avatar = data.avatar;
    if (data.skill !== undefined) profileSet.skill = data.skill;
    if (data.interests !== undefined) profileSet.interests = data.interests;
    if (data.passwordHash !== undefined) profileSet.passwordHash = data.passwordHash;

    // First op: ensure the doc exists with the right profile fields.
    // On insert, $setOnInsert provides the default stats block.
    await PlayerModel.updateOne(
      { playerId: data.playerId },
      {
        $set: profileSet,
        $setOnInsert: {
          stats: defaultStats(),
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Second op: patch only the fields that could conflict with $setOnInsert.
    // Safe now because the doc is guaranteed to exist.
    return (
      PlayerModel.findOneAndUpdate(
        { playerId: data.playerId },
        { $set: { "stats.lastActiveAt": now } },
        { new: true }
      ).lean() as unknown
    ) as PlayerProfile;
  },

  async updateById(
    playerId: string,
    update: Partial<{
      name: string;
      avatar: string;
      skill: string;
      interests: string[];
      stats: Record<string, unknown>;
    }>
  ) {
    await connectToDatabase();
    return (
      PlayerModel.findOneAndUpdate({ playerId }, update, { new: true }).lean() as unknown
    ) as PlayerProfile | null;
  },

  async patchStats(playerId: string, statPatch: Record<string, unknown>) {
    await connectToDatabase();
    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(statPatch)) {
      update[`stats.${key}`] = value;
    }
    return (
      PlayerModel.findOneAndUpdate({ playerId }, { $set: update }, { new: true }).lean() as unknown
    ) as PlayerProfile | null;
  },

  async pushMilestone(playerId: string, milestone: number) {
    await connectToDatabase();
    return (
      PlayerModel.findOneAndUpdate(
        { playerId },
        { $addToSet: { "stats.milestonesClaimed": milestone } },
        { new: true }
      ).lean() as unknown
    ) as PlayerProfile | null;
  },

  async pushArenaSolved(playerId: string, problemId: string) {
    await connectToDatabase();
    return (
      PlayerModel.findOneAndUpdate(
        { playerId },
        { $addToSet: { "stats.arenaSolved": problemId } },
        { new: true }
      ).lean() as unknown
    ) as PlayerProfile | null;
  },

  async countHigherXp(totalXp: number) {
    await connectToDatabase();
    return PlayerModel.countDocuments({ "stats.totalXp": { $gt: totalXp } });
  },

  async getLeaderboard(limit = 5) {
    await connectToDatabase();
    return PlayerModel.find({})
      .sort({ "stats.totalXp": -1, "stats.dailyStreak": -1 })
      .limit(limit)
      .lean();
  },

  /**
   * Legacy backfill: set playerId on a document that was created before
   * playerId existed. Uses the Mongo _id as the stable identifier.
   */
  async assignPlayerIdByMongoId(mongoId: string, playerId: string) {
    await connectToDatabase();
    return PlayerModel.updateOne(
      { _id: mongoId },
      { $set: { playerId } }
    );
  },

  /**
   * Another document with the same display name (trimmed, case-insensitive) and a different `playerId`.
   */
  /**
   * Case-insignificant callsign match, including `passwordHash` for credential login.
   * Returns null if no row or the player was created without a password (OAuth-only).
   */
  async findByCallsignForPasswordAuth(rawName: string) {
    await connectToDatabase();
    const name = rawName.trim();
    if (!name) return null;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const doc = await PlayerModel.findOne({
      name: { $regex: new RegExp(`^${esc}$`, "i") },
    })
      .select("+passwordHash")
      .lean();
    return doc as (PlayerProfile & { passwordHash?: string }) | null;
  },

  async existsOtherPlayerWithName(excludePlayerId: string, rawName: string) {
    await connectToDatabase();
    const name = rawName.trim();
    if (!name) return false;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const found = await PlayerModel.findOne({
      playerId: { $ne: excludePlayerId },
      name: { $regex: new RegExp(`^${esc}$`, "i") },
    })
      .select("playerId")
      .lean();
    return found != null;
  },

  /**
   * Audit: names that appear on more than one player (case-insensitive, trimmed).
   * Use `npm run db:duplicates` to print this from the project root.
   */
  async aggregateDuplicateNameReport() {
    await connectToDatabase();
    type Row = {
      _id: string;
      count: number;
      playerIds: string[];
      displayNames: string[];
    };
    return PlayerModel.aggregate<Row>([
      { $match: { name: { $type: "string", $ne: "" } } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$name" } } },
          count: { $sum: 1 },
          playerIds: { $push: "$playerId" },
          displayNames: { $addToSet: "$name" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]).exec();
  },
};
