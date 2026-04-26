import { Schema, model, models } from "mongoose";

const XpEventSchema = new Schema(
  {
    playerId: { type: String, required: true, index: true },
    // Snapshot of the player's display name at the time of the award.
    // Kept for analytics / history even if the player renames.
    playerName: { type: String, required: true, index: true },
    source: { type: String, required: true, index: true },
    sourceRef: { type: String },
    baseAmount: { type: Number, required: true },
    multiplier: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    difficulty: { type: String },
    levelBefore: { type: Number, required: true },
    levelAfter: { type: Number, required: true },
    totalXpAfter: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Idempotency: a given (playerId, source, sourceRef) may only be rewarded once.
XpEventSchema.index(
  { playerId: 1, source: 1, sourceRef: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceRef: { $exists: true, $type: "string" } },
  }
);

XpEventSchema.index({ playerId: 1, createdAt: -1 });
XpEventSchema.index({ createdAt: -1 });

export const XpEventModel = models.XpEvent || model("XpEvent", XpEventSchema);
