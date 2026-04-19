import type { QuestPayload } from "../types/quest";

export type QuestTemplate = {
  id: string;
  concept: string;
  difficulty: "beginner" | "builder" | "competitive";
  type: "classification" | "data-cleaning" | "debug" | "battle";
  systemPrompt: string;
  fallback: (seed: number) => QuestPayload;
};

export const questTemplates: QuestTemplate[] = [
  {
    id: "intro-classification",
    concept: "input-output mapping",
    difficulty: "beginner",
    type: "classification",
    systemPrompt: `You are a game quest designer for a 2D AI RPG.\nGenerate a JSON object with keys: story, dataset, question, options, answerIndex, explanation.\nThe concept is input-output classification.\nDifficulty: beginner.\nStory must be 2-3 sentences. Dataset should have 4 rows of {input, output}. Options should be 4 strings. answerIndex must be 0-3.\nSeed: {{seed}}\nReturn JSON only.`,
    fallback: (seed: number) => {
      const variant = seed % 3;
      const datasets: QuestPayload[] = [
        {
          story:
            "A beacon from Sector 7 repeats a signal pattern. Your AI core must learn how the station labels each tone.",
          dataset: [
            { input: "Tone A", output: "Safe" },
            { input: "Tone B", output: "Warning" },
            { input: "Tone C", output: "Safe" },
            { input: "Tone D", output: "Critical" },
          ],
          question: "The beacon transmits Tone B. What label should the model output?",
          options: ["Safe", "Warning", "Critical", "Unknown"],
          answerIndex: 1,
          explanation: "Tone B maps to Warning in the dataset.",
        },
        {
          story:
            "A cargo drone classifies planets by color to avoid hazards. Your AI must replicate the mapping.",
          dataset: [
            { input: "Blue Planet", output: "Habitable" },
            { input: "Red Planet", output: "Hot" },
            { input: "Green Planet", output: "Lush" },
            { input: "Gray Planet", output: "Barren" },
          ],
          question: "The scanner detects a Red Planet. What output should you send?",
          options: ["Lush", "Hot", "Habitable", "Barren"],
          answerIndex: 1,
          explanation: "Red Planet is labeled Hot.",
        },
        {
          story:
            "An AI dock assistant sorts incoming ships by signal pattern. Teach it the correct label.",
          dataset: [
            { input: "Pattern ZX", output: "Trade" },
            { input: "Pattern QP", output: "Research" },
            { input: "Pattern LM", output: "Rescue" },
            { input: "Pattern AR", output: "Defense" },
          ],
          question: "Pattern LM arrives at the dock. Which label is correct?",
          options: ["Defense", "Rescue", "Research", "Trade"],
          answerIndex: 1,
          explanation: "Pattern LM maps to Rescue.",
        },
      ];
      return datasets[variant];
    },
  },
];

export const getTemplateById = (id: string) =>
  questTemplates.find((template) => template.id === id);
