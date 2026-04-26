import { Schema, model, models } from "mongoose";

const VibeVoteSchema = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: "VibeSubmission", required: true },
    voterId: { type: String, required: true },
  },
  { timestamps: true }
);

VibeVoteSchema.index({ submissionId: 1, voterId: 1 }, { unique: true });

export const VibeVoteModel = models.VibeVote || model("VibeVote", VibeVoteSchema);
