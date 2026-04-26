import Groq from "groq-sdk";
import { env } from "../config/env";
import type { QuestPayload } from "../types/quest";
import type { QuestTemplate } from "../data/questTemplates";
import type {
  ArenaDifficulty,
  ArenaProblem,
  ArenaCaseResult,
} from "../types/arena";

const client = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

/**
 * Parse a JSON object out of a Groq response that may contain fences,
 * chain-of-thought prose, or extra text. Returns null on failure.
 */
function extractJson(raw: string | null | undefined): unknown {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback: find the first { ... } block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

const OPENCODE_SYSTEM_PROMPT = `You are OpenCode, the in-game advisor inside SageX \u2014 a 2D RPG that teaches players how to build AI agents.
- You speak like a calm, direct senior engineer. Concise. Zero fluff. No emojis.
- You help with: prompt engineering, agent design, tool chains, evals, safety, deployment, and SageX arena problems.
- When a player shares context (level, current quest, code, prompt), use it. Otherwise, ask one short clarifying question.
- Keep answers under 120 words unless the player explicitly asks for depth.
- If asked something outside agents / SageX, politely redirect.`;

export const AiService = {
  /**
   * OpenCode advisor. Cheap single-turn call that returns terse guidance.
   */
  async opencodeAdvise(args: {
    query: string;
    context?: {
      playerName?: string;
      level?: number;
      rank?: string;
      focus?: string;
    };
  }) {
    if (!client) return null;

    const contextLine = args.context
      ? `Player context: ${[
          args.context.playerName && `name=${args.context.playerName}`,
          args.context.level !== undefined && `level=${args.context.level}`,
          args.context.rank && `rank=${args.context.rank}`,
          args.context.focus && `focus=${args.context.focus}`,
        ]
          .filter(Boolean)
          .join(" ")}`
      : "";

    const response = await client.chat.completions.create({
      model: env.groqModel,
      messages: [
        { role: "system", content: OPENCODE_SYSTEM_PROMPT },
        ...(contextLine ? [{ role: "system" as const, content: contextLine }] : []),
        { role: "user", content: args.query },
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    return response.choices[0]?.message?.content?.trim() ?? null;
  },

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
    return extractJson(content) as QuestPayload | null;
  },

  /**
   * Generate a brand-new arena problem (prompt-engineering challenge)
   * at the requested difficulty. Returns a partially-typed object ready
   * to be validated and saved.
   */
  async generateArenaProblem(difficulty: ArenaDifficulty, topicHint?: string) {
    if (!client) return null;

    const rubricByDifficulty: Record<ArenaDifficulty, string> = {
      beginner:
        "The task should be simple: single-step extraction, classification, or summarization. Test cases should have unambiguous right answers.",
      builder:
        "The task should require 2-3 steps: e.g. extract + validate, classify + justify, or summarize + structure. Test cases should reward specific formatting.",
      competitive:
        "The task should be subtle: edge cases, ambiguous inputs, structured output under constraints. Rubric should be strict.",
    };

    const userPrompt = `Generate a prompt-engineering challenge for an AI learning platform.

Difficulty: ${difficulty}
${topicHint ? `Topic hint: ${topicHint}` : ""}
Guidance: ${rubricByDifficulty[difficulty]}

Return ONLY a JSON object with this exact shape:
{
  "slug": "kebab-case-slug-max-40-chars",
  "title": "Short title (max 60 chars)",
  "topic": "one word like extraction, classification, summarization, reformat, reasoning",
  "scenario": "2-4 sentence real-world scenario explaining the problem context",
  "task": "One imperative sentence telling the user what their prompt must make the model do",
  "starterPrompt": "An optional 1-line hint or empty string",
  "testCases": [
    { "input": "literal user input string", "expected": "what a correct output must contain or look like", "rubric": "how to judge this case in one sentence" },
    { "input": "...", "expected": "...", "rubric": "..." },
    { "input": "...", "expected": "...", "rubric": "..." }
  ],
  "rubric": "Overall grading guidance used to score the prompt's outputs against expectations. 2-3 sentences."
}

Include exactly 3 test cases. Do not include code fences or markdown.`;

    const response = await client.chat.completions.create({
      model: env.groqModel,
      messages: [
        {
          role: "system",
          content:
            "You generate high-quality AI learning content. Output only valid JSON, no code fences, no prose.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const parsed = extractJson(response.choices[0]?.message?.content);
    return parsed as Partial<ArenaProblem> | null;
  },

  /**
   * Run the user's prompt against every test case and have Groq grade
   * each output against the problem's rubric. Returns per-case scores
   * (0-100) plus an overall score and written feedback.
   */
  async gradeArenaSubmission(args: {
    problem: ArenaProblem;
    userPrompt: string;
  }) {
    if (!client) {
      return null;
    }

    const { problem, userPrompt } = args;

    // Phase 1: run the user's prompt on each test case input to get an
    // actual model output. We treat the user's prompt as the SYSTEM prompt
    // and each test input as the USER message.
    const runs: Array<{ input: string; output: string; error?: string }> = [];
    for (const tc of problem.testCases) {
      try {
        const run = await client.chat.completions.create({
          model: env.groqModel,
          messages: [
            { role: "system", content: userPrompt },
            { role: "user", content: tc.input },
          ],
          temperature: 0.1,
          max_tokens: 500,
        });
        runs.push({
          input: tc.input,
          output: run.choices[0]?.message?.content ?? "",
        });
      } catch (err) {
        runs.push({
          input: tc.input,
          output: "",
          error: err instanceof Error ? err.message : "unknown error",
        });
      }
    }

    // Phase 2: ask a grader model to score each run against its rubric
    // plus provide an overall assessment.
    const graderPrompt = `You are a strict but fair grader for a prompt-engineering challenge.

PROBLEM: ${problem.title}
SCENARIO: ${problem.scenario}
TASK: ${problem.task}
OVERALL RUBRIC: ${problem.rubric}

The USER'S PROMPT was:
"""
${userPrompt}
"""

Below are the test cases, what the prompt produced, and the per-case rubric.
Score each case from 0 to 100 based ONLY on whether the output satisfies the per-case rubric and the "expected" description.
Also produce an overall score (0-100) and 1-3 sentences of constructive feedback for the user.

Return ONLY JSON:
{
  "overallScore": 0-100,
  "overallFeedback": "string",
  "results": [
    { "caseScore": 0-100, "feedback": "one sentence" }
    // one per test case, in order
  ]
}

Test cases:
${problem.testCases
  .map(
    (tc, idx) => `
Case ${idx + 1}:
  input: ${JSON.stringify(tc.input)}
  expected: ${JSON.stringify(tc.expected)}
  rubric: ${JSON.stringify(tc.rubric)}
  actual_output: ${JSON.stringify(runs[idx]?.output ?? "")}
  ${runs[idx]?.error ? `error: ${runs[idx]?.error}` : ""}
`
  )
  .join("\n")}
`;

    const grader = await client.chat.completions.create({
      model: env.groqModel,
      messages: [
        {
          role: "system",
          content:
            "You are a grading engine. Output only valid JSON, no prose.",
        },
        { role: "user", content: graderPrompt },
      ],
      temperature: 0,
    });

    const parsed = extractJson(grader.choices[0]?.message?.content) as {
      overallScore?: number;
      overallFeedback?: string;
      results?: Array<{ caseScore?: number; feedback?: string }>;
    } | null;

    if (!parsed) return null;

    const results: ArenaCaseResult[] = problem.testCases.map((tc, idx) => {
      const run = runs[idx];
      const graded = parsed.results?.[idx];
      const rawScore = Number(graded?.caseScore ?? 0);
      return {
        input: tc.input,
        output: run?.output ?? "",
        caseScore: Math.max(0, Math.min(100, Math.round(rawScore))),
        feedback: graded?.feedback ?? "",
      };
    });

    const overall = Number(parsed.overallScore ?? 0);
    const score = Math.max(0, Math.min(100, Math.round(overall)));

    return {
      score,
      results,
      overallFeedback: parsed.overallFeedback ?? "",
      model: env.groqModel,
    };
  },
};
