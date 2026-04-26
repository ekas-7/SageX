import type {
  ArenaDifficulty,
  ArenaProblem,
  ArenaTestCase,
} from "../types/arena";

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "problem";

/**
 * Fallback problem used when Groq is unavailable. Keeps the arena
 * working even without an API key.
 */
function fallbackProblem(difficulty: ArenaDifficulty): Partial<ArenaProblem> {
  const base: Record<ArenaDifficulty, Partial<ArenaProblem>> = {
    beginner: {
      title: "Extract order number",
      topic: "extraction",
      scenario:
        "Customers message support with various complaints. You need a prompt that extracts the order number (format: ORD-XXXXX) from any message, or returns 'NONE' if no order number is present.",
      task: "Write a system prompt that outputs ONLY the order number (or 'NONE') with no extra words.",
      starterPrompt:
        "You extract order numbers from customer messages. Output the order number or NONE.",
      testCases: [
        {
          input: "Hi, my order ORD-12345 never arrived. Can you help?",
          expected: "ORD-12345",
          rubric: "Output must be exactly ORD-12345 with no extra text.",
        },
        {
          input: "I want a refund please, I'm so frustrated.",
          expected: "NONE",
          rubric: "No order number present. Must output exactly NONE.",
        },
        {
          input: "Order ord-99887 was wrong, and also ORD-11111 was late.",
          expected: "ORD-99887 or ORD-11111",
          rubric:
            "Output one order number in the uppercase ORD-NNNNN format.",
        },
      ],
      rubric:
        "Output should be ONLY the answer, uppercase, no prose. Case-insensitive detection is fine but output must be uppercase.",
    },
    builder: {
      title: "Classify + justify feedback",
      topic: "classification",
      scenario:
        "A SaaS team needs to triage incoming user feedback into bug, feature-request, question, or praise, with a one-line reason. Output must be parseable.",
      task: "Write a system prompt that returns JSON like {\"category\": \"bug\", \"reason\": \"...\"}.",
      starterPrompt:
        "You classify user feedback into exactly one of: bug, feature-request, question, praise. Return strict JSON.",
      testCases: [
        {
          input: "The Save button throws 500 every time I click it on Firefox.",
          expected: '{"category":"bug","reason":"..."}',
          rubric:
            "Category must be 'bug'. Output must be valid JSON with category and reason fields.",
        },
        {
          input: "Can you add dark mode? I read in tinted-screen mode at night.",
          expected: '{"category":"feature-request","reason":"..."}',
          rubric: "Category must be 'feature-request'.",
        },
        {
          input: "You guys are lifesavers, the new dashboard is so clean.",
          expected: '{"category":"praise","reason":"..."}',
          rubric: "Category must be 'praise'.",
        },
      ],
      rubric:
        "Output must be strict JSON (no markdown, no fences). Category must be one of the four listed. Reason should be one short sentence.",
    },
    competitive: {
      title: "Structured rant to action plan",
      topic: "reformat",
      scenario:
        "Engineers often file noisy bug reports. You need a prompt that converts a rambling engineer message into a concise action plan JSON: {summary, severity (low|med|high), steps_to_reproduce[], owner_hint}.",
      task: "Write a system prompt that always outputs valid JSON matching that schema, even when the input is chaotic.",
      starterPrompt: "",
      testCases: [
        {
          input:
            "ok so the deploy pipeline is borked AGAIN. staging is fine but prod 502s on every request to /api/orders. probably the sidecar. @vinod u seeing this?",
          expected:
            '{"summary":"prod /api/orders 502","severity":"high","steps_to_reproduce":["hit prod /api/orders"],"owner_hint":"vinod"}',
          rubric:
            "Severity must be 'high' (prod outage). Summary must mention prod + 502. steps_to_reproduce must be a non-empty array. owner_hint should be 'vinod'.",
        },
        {
          input:
            "tiny thing, the footer copyright still says 2019. no rush.",
          expected:
            '{"summary":"stale footer copyright year","severity":"low","steps_to_reproduce":["view any page footer"],"owner_hint":"..."}',
          rubric:
            "Severity must be 'low'. summary concise. steps_to_reproduce must be populated.",
        },
        {
          input:
            "sometimes the login form hangs for like 10s on slow 3G. hard to repro. probably related to that fontfile we added?",
          expected:
            '{"summary":"login form slow on slow 3G","severity":"med","steps_to_reproduce":["throttle to slow 3G","open /login","submit credentials"],"owner_hint":"..."}',
          rubric:
            "Severity must be 'med'. summary should mention slow 3G + login. steps_to_reproduce should include throttling + the login flow.",
        },
      ],
      rubric:
        "Output must be strict JSON, schema exact. Severity values only low/med/high. steps_to_reproduce must always be an array with >=1 entry.",
    },
  };
  return base[difficulty];
}

export const ArenaService = {
  /**
   * Validate and normalize an AI-generated problem. Returns null if
   * the shape is too broken to recover.
   */
  normalizeGenerated(
    raw: Partial<ArenaProblem> | null,
    difficulty: ArenaDifficulty
  ): ArenaProblem | null {
    const candidate = raw ?? fallbackProblem(difficulty);
    if (!candidate) return null;

    const testCasesRaw = Array.isArray(candidate.testCases)
      ? candidate.testCases
      : [];
    const testCases: ArenaTestCase[] = testCasesRaw
      .filter(
        (tc): tc is ArenaTestCase =>
          typeof tc === "object" &&
          tc !== null &&
          typeof (tc as ArenaTestCase).input === "string" &&
          typeof (tc as ArenaTestCase).expected === "string"
      )
      .map((tc) => ({
        input: tc.input.trim(),
        expected: tc.expected.trim(),
        rubric:
          typeof tc.rubric === "string" && tc.rubric.trim()
            ? tc.rubric.trim()
            : "Output must match the expected description.",
      }))
      .slice(0, 5);

    if (testCases.length < 2) return null;

    const title =
      typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title.trim()
        : "Prompt Challenge";
    const scenario =
      typeof candidate.scenario === "string" && candidate.scenario.trim()
        ? candidate.scenario.trim()
        : "Write a prompt that solves the stated task.";
    const task =
      typeof candidate.task === "string" && candidate.task.trim()
        ? candidate.task.trim()
        : "Solve the scenario with a single system prompt.";
    const rubric =
      typeof candidate.rubric === "string" && candidate.rubric.trim()
        ? candidate.rubric.trim()
        : "Output should closely match the expected answer per test case.";
    const topic =
      typeof candidate.topic === "string" && candidate.topic.trim()
        ? candidate.topic.trim().toLowerCase()
        : "general";
    const starterPrompt =
      typeof candidate.starterPrompt === "string"
        ? candidate.starterPrompt.trim()
        : "";
    const providedSlug =
      typeof candidate.slug === "string" ? candidate.slug.trim() : "";
    const slug = providedSlug
      ? slugify(providedSlug)
      : `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
    const problemId = `arena-${slug}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    return {
      problemId,
      slug,
      title,
      difficulty,
      topic,
      scenario,
      task,
      starterPrompt,
      testCases,
      rubric,
      maxScore: 100,
      solvedCount: 0,
      attemptCount: 0,
    };
  },

  /**
   * Given a raw overall score (0-100), decide if the attempt counts as
   * "passed" and what XP modifier to apply.
   */
  verdict(score: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    return {
      score: clamped,
      passed: clamped >= 70,
      partial: clamped >= 40 && clamped < 70,
      // 70+ → full reward; 40-69 → partial; <40 → nothing.
      xpFactor:
        clamped >= 70 ? Math.min(1.5, 0.8 + clamped / 200) : clamped / 100,
    };
  },
};
