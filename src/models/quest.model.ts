import { Schema, model, models } from "mongoose";

const QuestSchema = new Schema(
  {
    seed: { type: Number, required: true, index: true },
    templateId: { type: String, required: true },
    difficulty: { type: String, required: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const QuestModel = models.Quest || model("Quest", QuestSchema);
