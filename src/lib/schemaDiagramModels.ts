import type { Model } from "mongoose";

type AnyModel = Model<unknown>;
import { ArenaAttemptModel } from "@/src/models/arenaAttempt.model";
import { ArenaProblemModel } from "@/src/models/arenaProblem.model";
import { PlayerModel } from "@/src/models/player.model";
import { QuestModel } from "@/src/models/quest.model";
import { VibePromptModel } from "@/src/models/vibePrompt.model";
import { VibeSubmissionModel } from "@/src/models/vibeSubmission.model";
import { VibeVoteModel } from "@/src/models/vibeVote.model";
import { XpEventModel } from "@/src/models/xpEvent.model";

/** All Mongoose models — used for schema visualization. */
export const schemaDiagramModels: AnyModel[] = [
  ArenaAttemptModel,
  ArenaProblemModel,
  PlayerModel,
  QuestModel,
  VibePromptModel,
  VibeSubmissionModel,
  VibeVoteModel,
  XpEventModel,
];
