import { Schema, model, models } from "mongoose";

const VibeSubmissionSchema = new Schema(
  {
    promptId: { type: Schema.Types.ObjectId, ref: "VibePrompt", required: true, index: true },
    authorName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    code: {
      html: { type: String, default: "" },
      css: { type: String, default: "" },
      js: { type: String, default: "" },
    },
    stats: {
      upvotes: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const VibeSubmissionModel =
  models.VibeSubmission || model("VibeSubmission", VibeSubmissionSchema);
