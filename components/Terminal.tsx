"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  useDataChannel,
  useLocalParticipant,
} from "@livekit/components-react";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type TerminalLine = {
  id: string;
  author: string; // who typed it (local pilot or remote participant)
  kind: "prompt" | "stdout" | "stderr" | "system" | "remote";
  text: string;
  at: number;
};

export type TerminalContext = {
  playerId?: string;
  playerName?: string;
};

type BroadcastMessage =
  | { t: "cmd"; author: string; cmd: string; at: number }
  | { t: "out"; author: string; kind: "stdout" | "stderr"; text: string; at: number }
  | { t: "hello"; author: string; at: number };

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
const decoder = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

const encodePayload = (payload: BroadcastMessage): Uint8Array => {
  const json = JSON.stringify(payload);
  if (encoder) return encoder.encode(json);
  return Uint8Array.from(Array.from(json).map((c) => c.charCodeAt(0)));
};

const decodePayload = (bytes: Uint8Array): BroadcastMessage | null => {
  try {
    const raw = decoder
      ? decoder.decode(bytes)
      : String.fromCharCode(...Array.from(bytes));
    return JSON.parse(raw) as BroadcastMessage;
  } catch {
    return null;
  }
};

// ────────────────────────────────────────────────────────────────
// Commands
// ────────────────────────────────────────────────────────────────

type CommandResult = {
  lines: Array<{ kind: "stdout" | "stderr"; text: string }>;
  clear?: boolean;
};

type CommandFn = (
  args: string[],
  ctx: TerminalContext,
  rawInput: string
) => Promise<CommandResult> | CommandResult;

const HELP_LINES = [
  "Available commands:",
  "  help                    show this help",
  "  clear                   wipe the scrollback",
  "  whoami                  show your pilot identity",
  "  echo <text>             print <text>",
  "  date                    current ISO timestamp",
  "  level                   show your level + XP",
  "  xp [source]             show XP awarded by source",
  "  quests                  show available quest sources",
  "  agent <idea>            outline an AI agent for <idea>",
  "  opencode <question>     ask OpenCode for advice",
  "  leaderboard             top 5 players",
  "  ping                    broadcast a ping to everyone in the room",
];

const buildCommands = (): Record<string, CommandFn> => ({
  help: () => ({
    lines: HELP_LINES.map((text) => ({ kind: "stdout", text })),
  }),

  clear: () => ({ lines: [], clear: true }),

  whoami: (_args, ctx) => ({
    lines: [
      {
        kind: "stdout",
        text: ctx.playerName
          ? `pilot: ${ctx.playerName}\nid:    ${ctx.playerId ?? "(none)"}`
          : "pilot: unknown (sign in at /onboarding)",
      },
    ],
  }),

  echo: (args) => ({
    lines: [{ kind: "stdout", text: args.join(" ") }],
  }),

  date: () => ({
    lines: [{ kind: "stdout", text: new Date().toISOString() }],
  }),

  ping: (_args, ctx) => ({
    lines: [
      {
        kind: "stdout",
        text: `> ping broadcast from ${ctx.playerName ?? "anonymous"}`,
      },
    ],
  }),

  async level(_args, ctx) {
    if (!ctx.playerId) {
      return {
        lines: [
          { kind: "stderr", text: "No pilot signed in. Try /onboarding." },
        ],
      };
    }
    try {
      const res = await fetch(
        `/api/xp/summary?playerId=${encodeURIComponent(ctx.playerId)}`
      );
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        summary?: {
          level: number;
          totalXp: number;
          rank: string;
          xpToNext: number;
          dailyStreak: number;
          streakMultiplier: number;
        };
      };
      if (!res.ok || !payload.ok || !payload.summary) {
        return {
          lines: [
            { kind: "stderr", text: payload.error ?? "XP endpoint error" },
          ],
        };
      }
      const s = payload.summary;
      return {
        lines: [
          {
            kind: "stdout",
            text: `Lv ${s.level}  ${s.rank}
Total XP:    ${s.totalXp}
To next:     ${s.xpToNext}
Streak:      ${s.dailyStreak}d  (x${s.streakMultiplier.toFixed(2)})`,
          },
        ],
      };
    } catch (err) {
      return {
        lines: [
          {
            kind: "stderr",
            text: err instanceof Error ? err.message : "Network error",
          },
        ],
      };
    }
  },

  async xp(_args, ctx) {
    if (!ctx.playerId) {
      return {
        lines: [{ kind: "stderr", text: "No pilot signed in." }],
      };
    }
    try {
      const res = await fetch(
        `/api/xp/summary?playerId=${encodeURIComponent(ctx.playerId)}`
      );
      const payload = (await res.json()) as {
        ok?: boolean;
        summary?: {
          recentEvents: Array<{
            source: string;
            finalAmount: number;
            createdAt?: string;
          }>;
        };
      };
      if (!payload.ok || !payload.summary) {
        return {
          lines: [{ kind: "stderr", text: "XP endpoint error" }],
        };
      }
      const events = payload.summary.recentEvents;
      if (events.length === 0) {
        return {
          lines: [
            { kind: "stdout", text: "No XP events yet. Go finish a quest." },
          ],
        };
      }
      const text = events
        .slice(0, 8)
        .map((e) => `  +${e.finalAmount.toString().padStart(4)}  ${e.source}`)
        .join("\n");
      return {
        lines: [
          { kind: "stdout", text: `Recent XP:\n${text}` },
        ],
      };
    } catch (err) {
      return {
        lines: [
          {
            kind: "stderr",
            text: err instanceof Error ? err.message : "Network error",
          },
        ],
      };
    }
  },

  quests: () => ({
    lines: [
      {
        kind: "stdout",
        text: `Sources of XP:
  /lab            classification quests
  /ethics         scenario decisions
  /arena          prompt-engineering challenges
  /tools          checklist modules
  /side-quests    live agent co-build (this room!)`,
      },
    ],
  }),

  agent: (args) => {
    const idea = args.join(" ").trim();
    if (!idea) {
      return {
        lines: [
          { kind: "stderr", text: "Usage: agent <idea>   (e.g. agent triage support tickets)" },
        ],
      };
    }
    return {
      lines: [
        {
          kind: "stdout",
          text: `Agent sketch for "${idea}":
  1. Goal      one sentence: what the agent will accomplish
  2. Persona   tone, boundaries, refusal policy
  3. Tools     APIs / data sources needed
  4. Memory    what to remember between turns
  5. Guardrails preflight + postflight checks
  6. Evals     3-5 golden test cases
Tip: try \`opencode design an agent that ${idea}\` for detail.`,
        },
      ],
    };
  },

  async opencode(args, ctx, rawInput) {
    // Accept both `opencode foo bar` and `opencode: foo bar`
    const trimmed = rawInput.replace(/^opencode[:\s]*/i, "").trim();
    const query = args.length > 0 ? args.join(" ") : trimmed;
    if (!query) {
      return {
        lines: [
          {
            kind: "stderr",
            text: "Usage: opencode <question>\nExamples:\n  opencode how do I write a refund policy prompt?\n  opencode review my agent design",
          },
        ],
      };
    }
    try {
      const res = await fetch("/api/opencode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          playerId: ctx.playerId,
          playerName: ctx.playerName,
        }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        advice?: string;
      };
      if (!res.ok || !payload.ok || !payload.advice) {
        return {
          lines: [
            {
              kind: "stderr",
              text: payload.error ?? "OpenCode advisor unavailable.",
            },
          ],
        };
      }
      return {
        lines: [
          {
            kind: "stdout",
            text: `opencode> ${payload.advice}`,
          },
        ],
      };
    } catch (err) {
      return {
        lines: [
          {
            kind: "stderr",
            text: err instanceof Error ? err.message : "Network error",
          },
        ],
      };
    }
  },

  async leaderboard() {
    try {
      const res = await fetch(`/api/analytics?days=1`);
      const payload = (await res.json()) as {
        ok?: boolean;
        topPlayers?: Array<{
          name: string;
          level: number;
          totalXp: number;
          rank: string;
        }>;
      };
      if (!payload.ok || !payload.topPlayers) {
        return {
          lines: [{ kind: "stderr", text: "Leaderboard unavailable." }],
        };
      }
      const rows = payload.topPlayers
        .slice(0, 5)
        .map(
          (p, i) =>
            `  ${String(i + 1).padStart(2)}. ${p.name.padEnd(22)} Lv${String(p.level).padEnd(3)} ${p.totalXp.toString().padStart(6)} XP  ${p.rank}`
        )
        .join("\n");
      return {
        lines: [
          { kind: "stdout", text: `Top Pilots:\n${rows}` },
        ],
      };
    } catch (err) {
      return {
        lines: [
          {
            kind: "stderr",
            text: err instanceof Error ? err.message : "Network error",
          },
        ],
      };
    }
  },
});

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

type TerminalProps = {
  ctx: TerminalContext;
  dataChannelEnabled?: boolean;
  className?: string;
};

export default function Terminal({
  ctx,
  dataChannelEnabled = false,
  className,
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    {
      id: generateId(),
      author: "system",
      kind: "system",
      text: `SageX Terminal v1 \u00b7 type 'help' for commands${dataChannelEnabled ? " \u00b7 synced to room via LiveKit" : ""}`,
      at: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commands = useMemo(() => buildCommands(), []);

  const pushLines = useCallback((next: TerminalLine[]) => {
    setLines((prev) => [...prev, ...next]);
  }, []);

  const clearLines = useCallback(() => {
    setLines([
      {
        id: generateId(),
        author: "system",
        kind: "system",
        text: "cleared",
        at: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const author = ctx.playerName ?? "pilot";

  const common = {
    ctx,
    commands,
    lines,
    input,
    history,
    historyIdx,
    busy,
    author,
    className,
    scrollRef,
    inputRef,
    setInput,
    setHistory,
    setHistoryIdx,
    setBusy,
    pushLines,
    clearLines,
  };

  return dataChannelEnabled ? (
    <TerminalWithDataChannel {...common} />
  ) : (
    <TerminalShell {...common} broadcast={null} />
  );
}

// ────────────────────────────────────────────────────────────────
// Shared shell UI
// ────────────────────────────────────────────────────────────────

type ShellProps = {
  ctx: TerminalContext;
  commands: Record<string, CommandFn>;
  lines: TerminalLine[];
  input: string;
  history: string[];
  historyIdx: number | null;
  busy: boolean;
  author: string;
  className?: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setInput: (v: string) => void;
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setHistoryIdx: React.Dispatch<React.SetStateAction<number | null>>;
  setBusy: (b: boolean) => void;
  pushLines: (next: TerminalLine[]) => void;
  clearLines: () => void;
  broadcast: ((msg: BroadcastMessage) => void) | null;
};

function TerminalShell(props: ShellProps) {
  const {
    ctx,
    commands,
    lines,
    input,
    history,
    historyIdx,
    busy,
    author,
    className,
    scrollRef,
    inputRef,
    setInput,
    setHistory,
    setHistoryIdx,
    setBusy,
    pushLines,
    clearLines,
    broadcast,
  } = props;

  const runCommand = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Echo the prompt line locally.
    pushLines([
      {
        id: generateId(),
        author,
        kind: "prompt",
        text: trimmed,
        at: Date.now(),
      },
    ]);

    // Broadcast the typed command to the room.
    broadcast?.({
      t: "cmd",
      author,
      cmd: trimmed,
      at: Date.now(),
    });

    setHistory((h) => [...h, trimmed].slice(-50));
    setHistoryIdx(null);

    const [name, ...rest] = trimmed.split(/\s+/);
    const fn = commands[name.toLowerCase()];
    if (!fn) {
      pushLines([
        {
          id: generateId(),
          author: "system",
          kind: "stderr",
          text: `sagex: command not found: ${name}`,
          at: Date.now(),
        },
      ]);
      return;
    }

    setBusy(true);
    try {
      const result = await fn(rest, ctx, trimmed);
      if (result.clear) {
        clearLines();
        return;
      }
      const batch: TerminalLine[] = result.lines.map((l) => ({
        id: generateId(),
        author: "opencode",
        kind: l.kind,
        text: l.text,
        at: Date.now(),
      }));
      pushLines(batch);

      // Broadcast each output line so other participants see the result.
      for (const l of result.lines) {
        broadcast?.({
          t: "out",
          author,
          kind: l.kind,
          text: l.text,
          at: Date.now(),
        });
      }
    } catch (err) {
      pushLines([
        {
          id: generateId(),
          author: "system",
          kind: "stderr",
          text: err instanceof Error ? err.message : "Unknown error",
          at: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const val = input;
      setInput("");
      void runCommand(val);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const nextIdx =
        historyIdx === null
          ? history.length - 1
          : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx] ?? "");
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIdx === null) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(null);
        setInput("");
      } else {
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] ?? "");
      }
      return;
    }
    // Esc shouldn't trigger the global escape-to-map when the terminal is focused.
    if (event.key === "Escape") {
      event.stopPropagation();
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
    }
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-black/80 font-mono text-[0.78rem] text-emerald-300 shadow-inner ${className ?? ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-[0.65rem] uppercase tracking-wider text-emerald-400/70">
        <span>sagex@terminal:~</span>
        <span className="flex items-center gap-2 text-emerald-400/50">
          {busy && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          )}
          <span>
            {broadcast ? "sync: room" : "sync: local"}
          </span>
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2"
      >
        {lines.map((line) => (
          <TerminalLineView key={line.id} line={line} />
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-white/5 bg-black/60 px-3 py-2">
        <span className="text-emerald-400">
          {author}
          <span className="text-emerald-500/60">$</span>
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={busy ? "running..." : "type `help`"}
          className="flex-1 bg-transparent text-emerald-100 outline-none placeholder:text-emerald-700"
        />
      </div>
    </div>
  );
}

function TerminalLineView({ line }: { line: TerminalLine }) {
  if (line.kind === "prompt") {
    return (
      <p className="text-emerald-300">
        <span className="text-emerald-400">{line.author}</span>
        <span className="text-emerald-500/60">$ </span>
        <span className="text-emerald-100">{line.text}</span>
      </p>
    );
  }
  if (line.kind === "remote") {
    return (
      <pre className="whitespace-pre-wrap break-words text-sky-300/90">
        <span className="text-sky-400">{line.author}:</span> {line.text}
      </pre>
    );
  }
  if (line.kind === "stderr") {
    return (
      <pre className="whitespace-pre-wrap break-words text-rose-300">
        {line.text}
      </pre>
    );
  }
  if (line.kind === "system") {
    return (
      <pre className="whitespace-pre-wrap break-words text-emerald-400/60">
        {line.text}
      </pre>
    );
  }
  return (
    <pre className="whitespace-pre-wrap break-words text-emerald-100">
      {line.text}
    </pre>
  );
}

// ────────────────────────────────────────────────────────────────
// LiveKit-aware wrapper
// ────────────────────────────────────────────────────────────────

function TerminalWithDataChannel(
  props: Omit<ShellProps, "broadcast">
) {
  const { pushLines, author } = props;
  const { send } = useDataChannel("sagex-terminal", (msg) => {
    const decoded = decodePayload(msg.payload);
    if (!decoded) return;
    if (decoded.author === author) return; // ignore our own echoes
    if (decoded.t === "cmd") {
      pushLines([
        {
          id: generateId(),
          author: decoded.author,
          kind: "remote",
          text: `$ ${decoded.cmd}`,
          at: decoded.at,
        },
      ]);
    } else if (decoded.t === "out") {
      pushLines([
        {
          id: generateId(),
          author: decoded.author,
          kind: decoded.kind,
          text: decoded.text,
          at: decoded.at,
        },
      ]);
    } else if (decoded.t === "hello") {
      pushLines([
        {
          id: generateId(),
          author: "system",
          kind: "system",
          text: `${decoded.author} joined the terminal.`,
          at: decoded.at,
        },
      ]);
    }
  });
  const local = useLocalParticipant();

  // Announce arrival.
  useEffect(() => {
    const identity = local.localParticipant?.identity;
    if (!identity) return;
    void send(
      encodePayload({ t: "hello", author: identity, at: Date.now() }),
      { reliable: true }
    );
  }, [local.localParticipant?.identity, send]);

  const broadcast = useCallback(
    (msg: BroadcastMessage) => {
      void send(encodePayload(msg), { reliable: true }).catch(() => {
        // Non-fatal: terminal still works locally.
      });
    },
    [send]
  );

  return <TerminalShell {...props} broadcast={broadcast} />;
}
