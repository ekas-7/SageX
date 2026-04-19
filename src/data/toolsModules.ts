export type ToolStep = {
  id: string;
  title: string;
  detail: string;
  hint?: string;
};

export type ToolModule = {
  slug: string;
  title: string;
  tag: string;
  intro: string;
  estMinutes: number;
  steps: ToolStep[];
  nextSlug?: string;
};

export const TOOL_MODULES: ToolModule[] = [
  {
    slug: "prompt-studio",
    title: "Prompt Studio",
    tag: "Beginner",
    intro:
      "Craft prompt patterns that keep agents focused, reliable, and easy to debug.",
    estMinutes: 15,
    nextSlug: "tool-chains",
    steps: [
      {
        id: "goal",
        title: "Define the agent's single job",
        detail:
          "Write one sentence that starts with a verb: e.g. 'Summarize customer bug reports into Jira tickets.'",
        hint: "If you can't say it in one sentence, the prompt will drift.",
      },
      {
        id: "stack",
        title: "Stack a system + user prompt",
        detail:
          "System prompt = rules and persona. User prompt = the actual input. Keep them separated so you can swap inputs without touching rules.",
      },
      {
        id: "schema",
        title: "Force structured output",
        detail:
          "Ask for JSON with named keys (title, summary, priority). Structured output is testable; prose isn't.",
        hint: "Add a one-line example of the expected JSON at the end of your system prompt.",
      },
      {
        id: "guardrails",
        title: "Add refusal rules",
        detail:
          "Explicitly list what the agent should NOT do: no opinions, no PII, no guessing missing fields.",
      },
      {
        id: "compare",
        title: "Test two prompt variations",
        detail:
          "Run the same 3 inputs through version A and version B. Pick the one with fewer follow-up questions.",
        hint: "Document what changed between A and B. Prompt diffs matter.",
      },
    ],
  },
  {
    slug: "tool-chains",
    title: "Tool Chains",
    tag: "Builder",
    intro:
      "Connect APIs, knowledge bases, and memory into a single agent workflow.",
    estMinutes: 20,
    nextSlug: "safety-checks",
    steps: [
      {
        id: "map",
        title: "Map every tool to an objective",
        detail:
          "For each tool call, answer: why does the agent need this? If you can't answer, drop the tool.",
      },
      {
        id: "cache",
        title: "Decide cached vs live data",
        detail:
          "Static docs → cache. User state, prices, inventory → live. Cache staleness kills trust.",
      },
      {
        id: "fallback",
        title: "Design fallbacks per tool",
        detail:
          "What does the agent say when the tool times out, returns empty, or 500s? Write it now, not later.",
        hint: "A graceful 'I couldn't reach that system, here's what I know' beats a silent hang every time.",
      },
      {
        id: "memory",
        title: "Pick a memory strategy",
        detail:
          "Short-term (last N turns) for chat continuity. Long-term (vector DB) for user preferences.",
      },
      {
        id: "trace",
        title: "Log the full chain",
        detail:
          "Every tool call, input, output, latency. Without traces, debugging a multi-tool agent is impossible.",
      },
    ],
  },
  {
    slug: "safety-checks",
    title: "Safety Checks",
    tag: "Essential",
    intro: "Red-team your agent and install guardrails before launch.",
    estMinutes: 18,
    nextSlug: "evaluation-lab",
    steps: [
      {
        id: "threats",
        title: "List the top 5 failure modes",
        detail:
          "Prompt injection, PII leak, hallucinated citations, policy violations, jailbreaks. Prioritize what matters for your domain.",
      },
      {
        id: "redteam",
        title: "Write 10 red-team prompts",
        detail:
          "Adversarial inputs designed to break your agent. Keep this suite forever — it's your regression net.",
        hint: "Steal from public jailbreak corpora (DAN, STAN, etc.) — they're free and effective.",
      },
      {
        id: "filters",
        title: "Layer policy filters",
        detail:
          "Pre-filter user input (profanity, PII). Post-filter model output (hate, self-harm). Don't trust the model alone.",
      },
      {
        id: "incidents",
        title: "Plan an incident runbook",
        detail:
          "When a bad output reaches a user, who investigates, who pushes the fix, who notifies affected users?",
      },
      {
        id: "kill",
        title: "Build a kill switch",
        detail:
          "One env var or feature flag that disables the agent site-wide in <60 seconds. Test it today.",
      },
    ],
  },
  {
    slug: "evaluation-lab",
    title: "Evaluation Lab",
    tag: "Advanced",
    intro:
      "Score outputs, catch regressions, and automate quality checks over time.",
    estMinutes: 25,
    nextSlug: "deployment-runbook",
    steps: [
      {
        id: "metrics",
        title: "Define metrics per flow",
        detail:
          "Accuracy, latency, cost, user satisfaction. Pick 2–3; don't drown in dashboards.",
      },
      {
        id: "golden",
        title: "Build a golden set",
        detail:
          "30–100 hand-labeled examples of ideal agent behavior. This is your source of truth forever.",
        hint: "Start with real user logs, not synthetic prompts. Real beats clever.",
      },
      {
        id: "autograde",
        title: "Auto-grade with an eval LLM",
        detail:
          "Use a second (cheaper or stronger) model to score outputs against your rubric. Humans review disagreements.",
      },
      {
        id: "pipeline",
        title: "Wire evals into CI",
        detail:
          "Every prompt or model change runs the eval suite. Fail the PR if scores drop >5%.",
      },
      {
        id: "track",
        title: "Track scores over time",
        detail:
          "Chart accuracy + latency per release. Regressions you can see are regressions you can fix.",
      },
    ],
  },
  {
    slug: "deployment-runbook",
    title: "Deployment Runbook",
    tag: "Ops",
    intro:
      "Ship agents with monitoring, rollback, alerting, and a clean release process.",
    estMinutes: 20,
    nextSlug: "team-playbooks",
    steps: [
      {
        id: "checklist",
        title: "Pre-launch checklist",
        detail:
          "Evals green, rate limits set, cost alerts on, kill switch tested, rollback path documented.",
      },
      {
        id: "monitor",
        title: "Install the 3 core dashboards",
        detail:
          "Request volume + latency, error rate, cost per request. Everything else is secondary.",
      },
      {
        id: "alerts",
        title: "Set one-level alerts",
        detail:
          "Error rate >2% for 5 min → page. Cost >2x yesterday → page. Don't drown in warnings.",
      },
      {
        id: "rollback",
        title: "Rehearse rollback",
        detail:
          "Revert to last known good prompt + model in under 5 minutes. If you've never done it, do it today.",
      },
      {
        id: "launch",
        title: "Staged release",
        detail:
          "1% traffic → 10% → 50% → 100%. Hold at each stage long enough to see errors.",
        hint: "A 24h hold at 10% catches the bugs a 10-minute canary never will.",
      },
    ],
  },
  {
    slug: "team-playbooks",
    title: "Team Playbooks",
    tag: "Collab",
    intro:
      "Keep teams aligned with shared agent knowledge, prompts, and rituals.",
    estMinutes: 15,
    steps: [
      {
        id: "owner",
        title: "Name a single owner per agent",
        detail:
          "One person approves prompt changes. Committees kill prompts faster than bad prompts do.",
      },
      {
        id: "library",
        title: "Build a shared prompt library",
        detail:
          "Version-controlled folder of all prompts. Every prompt has: purpose, owner, last-edited, eval score.",
      },
      {
        id: "reviews",
        title: "Run weekly agent reviews",
        detail:
          "30 min review of failures, cost, user feedback. Ship the top 3 fixes next week.",
      },
      {
        id: "onboard",
        title: "Write the 'how to debug an agent' doc",
        detail:
          "New engineer joins Monday, ships an agent fix Friday. Your doc is the reason.",
      },
      {
        id: "retro",
        title: "Do a quarterly agent retro",
        detail:
          "What did users actually use vs what you built? Kill unused features, double down on loved ones.",
      },
    ],
  },
];

export const getModuleBySlug = (slug: string) =>
  TOOL_MODULES.find((m) => m.slug === slug);
