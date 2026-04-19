import { Schema, model, models } from "mongoose";

const XpEventSchema = new Schema(
  {
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

// Enforce idempotency: one (player, source, sourceRef) may only be rewarded once.
XpEventSchema.index(
  { playerName: 1, source: 1, sourceRef: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceRef: { $exists: true, $type: "string" } },
  }
);

XpEventSchema.index({ playerName: 1, createdAt: -1 });

export const XpEventModel = models.XpEvent || model("XpEvent", XpEventSchema);
