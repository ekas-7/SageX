import { Schema, model, models } from "mongoose";

const ArenaAttemptSchema = new Schema(
  {
    playerId: { type: String, required: true, index: true },
    problemId: { type: String, required: true, index: true },
    prompt: { type: String, required: true },
    score: { type: Number, required: true }, // 0-100
    passed: { type: Boolean, required: true },
    results: {
      type: [
        {
          input: { type: String, required: true },
          output: { type: String, default: "" },
          caseScore: { type: Number, required: true },
          feedback: { type: String, default: "" },
        },
      ],
      default: [],
    },
    overallFeedback: { type: String, default: "" },
    model: { type: String, required: true },
  },
  { timestamps: true }
);

ArenaAttemptSchema.index({ playerId: 1, createdAt: -1 });
ArenaAttemptSchema.index({ playerId: 1, problemId: 1, passed: 1 });

export const ArenaAttemptModel =
  models.ArenaAttempt || model("ArenaAttempt", ArenaAttemptSchema);
