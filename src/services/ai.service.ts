import Groq from "groq-sdk";
import { env } from "../config/env";
import type { QuestPayload } from "../types/quest";
import type { QuestTemplate } from "../data/questTemplates";

const client = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

export const AiService = {
  async generateQuest(template: QuestTemplate, seed: number) {
    if (!client) return null;

    const prompt = template.systemPrompt.replace("{{seed}}", String(seed));

    const response = await client.chat.completions.create({
      model: env.groqModel,
      messages: [
        {
          role: "system",
          content:
            "You output only valid JSON. Do not include code fences or extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    try {
      return JSON.parse(content) as QuestPayload;
    } catch {
      return null;
    }
  },
};
