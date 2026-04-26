import { Schema, model, models } from "mongoose";

const VibePromptSchema = new Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    buckets: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const VibePromptModel =
  models.VibePrompt || model("VibePrompt", VibePromptSchema);
