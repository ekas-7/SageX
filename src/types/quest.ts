export type QuestDatasetRow = {
  input: string;
  output: string;
};

export type QuestPayload = {
  story: string;
  dataset: QuestDatasetRow[];
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

export type QuestResponse = QuestPayload & {
  questId: string;
  seed: number;
  templateId: string;
  difficulty: "beginner" | "builder" | "competitive";
  type: "classification" | "data-cleaning" | "debug" | "battle";
};

export type QuestRecord = {
  _id: { toString(): string };
  seed: number;
  templateId: string;
  difficulty: string;
  type: string;
  payload: QuestPayload;
};
