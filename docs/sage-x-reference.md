# Sage-X quick reference

**Deployed app:** [https://sage-x.vercel.app](https://sage-x.vercel.app)

## Machine-readable API catalog

**`GET`** [https://sage-x.vercel.app/api/endpoints](https://sage-x.vercel.app/api/endpoints)

Returns JSON: origin, every route `path`, `methods`, `group`, and a full `url` (dynamic segments shown as `:id`).  
Source of truth: [`src/lib/apiEndpoints.ts`](../src/lib/apiEndpoints.ts) — update when you add or change handlers under `app/api/`.

## DB schema (Mongoose)

- Models live in [`src/models`](../src/models).
- **Interactive ER diagram (local only):** run `npm run dev`, then open [http://localhost:3000/dev/schema](http://localhost:3000/dev/schema).  
  Production builds hide this page (`NODE_ENV === "production"` → 404).

## Backend API (human table)

Base URL: `https://sage-x.vercel.app`

| Area | Method & path |
|------|----------------|
| Meta | `GET` [`/api/endpoints`](https://sage-x.vercel.app/api/endpoints) |
| Auth | `GET` / `POST` [`/api/auth/*`](https://sage-x.vercel.app/api/auth/signin) (Auth.js OAuth) |
| Analytics | `GET` [`/api/analytics`](https://sage-x.vercel.app/api/analytics) |
| Arena | `GET` [`/api/arena/next`](https://sage-x.vercel.app/api/arena/next) |
| Arena | `GET` [`/api/arena/problems`](https://sage-x.vercel.app/api/arena/problems) |
| Arena | `GET` [`/api/arena/problem/:id`](https://sage-x.vercel.app/api/arena/problem/example-id) |
| Arena | `POST` [`/api/arena/submit`](https://sage-x.vercel.app/api/arena/submit) |
| LiveKit | `POST` [`/api/livekit/token`](https://sage-x.vercel.app/api/livekit/token) |
| OpenCode | `POST` [`/api/opencode`](https://sage-x.vercel.app/api/opencode) |
| Player | `POST` [`/api/player`](https://sage-x.vercel.app/api/player) |
| Player | `POST` [`/api/player/rehydrate`](https://sage-x.vercel.app/api/player/rehydrate) |
| Quests | `GET` [`/api/quests/first`](https://sage-x.vercel.app/api/quests/first) |
| Stats | `GET` / `POST` [`/api/stats`](https://sage-x.vercel.app/api/stats) |
| Vibe | `GET` / `POST` [`/api/vibe/prompt`](https://sage-x.vercel.app/api/vibe/prompt) |
| Vibe | `GET` [`/api/vibe/leaderboard`](https://sage-x.vercel.app/api/vibe/leaderboard) |
| Vibe | `GET` / `POST` [`/api/vibe/submissions`](https://sage-x.vercel.app/api/vibe/submissions) |
| Vibe | `GET` [`/api/vibe/submissions/:id`](https://sage-x.vercel.app/api/vibe/submissions/example-id) |
| Vibe | `GET` [`/api/vibe/embed/:id`](https://sage-x.vercel.app/api/vibe/embed/example-id) |
| Vibe | `POST` [`/api/vibe/vote`](https://sage-x.vercel.app/api/vibe/vote) |
| XP | `POST` [`/api/xp/award`](https://sage-x.vercel.app/api/xp/award) |
| XP | `GET` [`/api/xp/summary`](https://sage-x.vercel.app/api/xp/summary) |

Replace `:id` / `example-id` with real IDs where routes are dynamic.
