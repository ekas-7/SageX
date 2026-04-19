"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readStoredPlayer, signInPlayer } from "@/src/lib/playerClient";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import Terminal from "../../components/Terminal";

const DEFAULT_ROOM = "sagex-side-quests";

function SideQuestsGrid({
  token,
  livekitUrl,
  onError,
  onDisconnected,
  children,
}: {
  token: string | null;
  livekitUrl: string;
  onError: (err: Error) => void;
  onDisconnected: () => void;
  children: React.ReactNode;
}) {
  const layout = "grid gap-6 lg:grid-cols-[1.7fr_1fr]";
  if (!token) {
    return <div className={layout}>{children}</div>;
  }
  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect
      video
      audio
      data-lk-theme="default"
      className={layout}
      onError={onError}
      onDisconnected={onDisconnected}
    >
      {children}
    </LiveKitRoom>
  );
}

function CallGrid() {
  const tracks = useTracks([
    {
      source: Track.Source.Camera,
      withPlaceholder: true,
    },
  ]);

  return (
    <GridLayout tracks={tracks} className="h-[420px]">
      <ParticipantTile />
    </GridLayout>
  );
}

function SideQuestsRoom() {
  const searchParams = useSearchParams();
  const [roomName, setRoomName] = useState(DEFAULT_ROOM);
  const [identity, setIdentity] = useState("Pilot");
  const [playerId, setPlayerId] = useState<string | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";

  useEffect(() => {
    const requestedRoom = searchParams.get("room");
    if (requestedRoom) {
      setRoomName(requestedRoom);
    }
  }, [searchParams]);

  useEffect(() => {
    const stored = readStoredPlayer();
    if (!stored) return;
    if (stored.name) setIdentity(stored.name);
    if (stored.playerId) setPlayerId(stored.playerId);
    // Background sign-in so the DB knows about this player.
    void signInPlayer(stored).then((next) => {
      setIdentity(next.name);
      setPlayerId(next.playerId);
    });
  }, []);

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = new URL("/side-quests", base);
    url.searchParams.set("room", roomName || DEFAULT_ROOM);
    return url.toString();
  }, [roomName]);

  const handleConnect = async () => {
    if (!roomName.trim()) {
      setError("Give your room a name to start the session.");
      return;
    }
    if (!livekitUrl) {
      setError(
        "Missing NEXT_PUBLIC_LIVEKIT_URL. Add your LiveKit server URL (wss://...) to .env.local and restart the dev server."
      );
      return;
    }

    setError(null);
    setStatus("connecting");
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName.trim(), identity: identity.trim() || "Pilot" }),
      });
      const payload = (await response.json()) as { token?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create LiveKit token.");
      }
      if (typeof payload.token !== "string" || payload.token.length === 0) {
        throw new Error("LiveKit token response was empty.");
      }
      setToken(payload.token);
      setStatus("connected");
    } catch (error) {
      setStatus("idle");
      setToken(null);
      setError(error instanceof Error ? error.message : "Unable to connect to LiveKit.");
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    setStatus("idle");
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        const ta = document.createElement("textarea");
        ta.value = inviteLink;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setError("Couldn't copy invite link. You can copy the URL from the address bar.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10">
      <div className="absolute inset-0 bg-[url('/assests/background/side-quests/background.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="page-label">Side Quest: LiveKit Lab</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="page-title text-3xl">Collaborative Agent Builder</h1>
              <p className="mt-2 page-description text-sm">
                Launch a LiveKit call to co-build AI agents, share prompts, and test workflows together in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="btn-primary text-xs disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConnect}
                disabled={status !== "idle"}
              >
                {status === "connected"
                  ? "Room Live"
                  : status === "connecting"
                    ? "Connecting..."
                    : "Start Room"}
              </button>
              <button className="btn-ghost text-xs" onClick={handleCopyInvite}>
                {inviteCopied ? "Invite Copied" : "Invite Collaborators"}
              </button>
            </div>
          </div>
        </header>

        <SideQuestsGrid
          token={token}
          livekitUrl={livekitUrl}
          onError={(err) => {
            setError(`LiveKit error: ${err.message}`);
            setStatus("idle");
            setToken(null);
          }}
          onDisconnected={() => {
            setStatus("idle");
            setToken(null);
          }}
        >
          <section className="glass-card flex flex-col gap-6 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">LiveKit Call Room</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Room status: {status === "connected" ? "Live" : status === "connecting" ? "Connecting" : "Ready"}
                  {roomName ? ` · ${roomName}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={status === "connected" ? "tag-accent" : "tag"}>
                  {status === "connected" ? "Live" : "Idle"}
                </span>
                <span className="tag font-mono">{identity}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
                Room Name
                <input
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)]"
                  placeholder="sagex-side-quests"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
                Pilot Name
                <input
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)]"
                  placeholder="Orion"
                />
              </label>
            </div>

            {!livekitUrl && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
                LiveKit is not configured. Add <code className="font-mono">NEXT_PUBLIC_LIVEKIT_URL</code>, <code className="font-mono">LIVEKIT_API_KEY</code>, and <code className="font-mono">LIVEKIT_API_SECRET</code> to <code className="font-mono">.env.local</code>, then restart the dev server.
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-100">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
              {token ? (
                <div className="flex flex-col gap-4">
                  <RoomAudioRenderer />
                  <CallGrid />
                  <ControlBar variation="minimal" />
                </div>
              ) : (
                <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center text-sm text-[var(--text-secondary)]">
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {status === "connecting" ? "Connecting..." : "Ready to connect"}
                  </p>
                  <p>Start a room to unlock live video, audio, and screen sharing.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
              <div className="flex items-center gap-3">
                <span className="tag">Mic</span>
                <span className="tag">Camera</span>
                <span className="tag">Share</span>
                <span className="tag">Record</span>
              </div>
              <button
                className="inline-flex h-8 items-center rounded-full bg-rose-500/80 px-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-rose-500"
                onClick={handleDisconnect}
                disabled={!token}
              >
                End Session
              </button>
            </div>
          </section>

          <aside className="flex min-h-[560px] flex-col">
            <Terminal
              ctx={{ playerId, playerName: identity }}
              dataChannelEnabled={Boolean(token)}
              className="h-full"
            />
          </aside>
        </SideQuestsGrid>

        <a href="/map" className="back-link">Back to map</a>
      </div>
    </div>
  );
}

function SideQuestsFallback() {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10">
      <div className="absolute inset-0 bg-[url('/assests/background/side-quests/background.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="page-label">Side Quest: LiveKit Lab</p>
          <h1 className="page-title text-3xl">Collaborative Agent Builder</h1>
          <p className="page-description text-sm">Loading session...</p>
        </header>
      </div>
    </div>
  );
}

export default function SideQuestsPage() {
  return (
    <Suspense fallback={<SideQuestsFallback />}>
      <SideQuestsRoom />
    </Suspense>
  );
}
