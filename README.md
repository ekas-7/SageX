# SageX AI Learning RPG MVP

SageX is a 2D RPG-style learning experience where players explore an AI city, complete quests, and unlock abilities as they master AI concepts.

## Deployment

- **Production:** [https://sage-x.vercel.app](https://sage-x.vercel.app)

## Vision 
**Traditional learning is dead.**

Gen Z doesn’t want another **40-minute tutorial** — they want a **high-stakes loop**.

That’s why we built **SageX**: a **2D RPG Space Academy** where users learn AI engineering through gameplay.

- No lectures.  
- No endless docs.  
- No passive watching.  

Just one addictive loop:

**Attempt → Real-time LLM Grade → XP**

We’re transforming education into something people *want* to come back to.

And this goes far beyond tech.

From AI engineering to finance, healthcare, design, law, and more  **SageX is built to gamify AI learning across every field.**

Because if learning isn’t as engaging as a game, it won’t win the future.


## API & documentation

- **Machine-readable route list:** `GET` [https://sage-x.vercel.app/api/endpoints](https://sage-x.vercel.app/api/endpoints) — JSON with `endpoints` (path, methods, `group`, `url`), plus `database` (Mongo + Player OAuth fields) and `auth` (Auth.js). Source: [`src/lib/apiEndpoints.ts`](src/lib/apiEndpoints.ts) and [`src/lib/dbSchemaMetadata.ts`](src/lib/dbSchemaMetadata.ts).
- **Human-readable reference** (tables, links, notes): [docs/sage-x-reference.md](docs/sage-x-reference.md).
- **Source of truth for the catalog:** [`src/lib/apiEndpoints.ts`](src/lib/apiEndpoints.ts) — update this when you add or change routes under `app/api/`.

## Database schema (Mongoose)

- **Models:** [`src/models`](src/models).
- **Interactive ER diagram (local dev only):** with `npm run dev`, open [http://localhost:3000/dev/schema](http://localhost:3000/dev/schema). Not served in production.

## Authentication

- **Auth.js (NextAuth v5)** — [`auth.ts`](auth.ts), route **`/api/auth/[...nextauth]`**. Providers: **Google** and **GitHub** (env: `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, plus **`AUTH_SECRET`**, **`AUTH_URL`** in production).
- **Player mapping** — on OAuth sign-in, [`src/services/oauthPlayer.service.ts`](src/services/oauthPlayer.service.ts) finds or creates a [`Player`](src/models/player.model.ts) with `playerId`, optional `email`, and `accountProvider` + `accountId`. JWT/session expose **`session.user.playerId`**.
- **`POST /api/player`** — if the user has a session, **`playerId` is forced from the session** (see [`src/controllers/player.controller.ts`](src/controllers/player.controller.ts)); anonymous users still send a client-minted id.
- **Client** — [`SessionSync`](components/SessionSync.tsx) mirrors the signed-in user into **`localStorage`** so existing flows keep working. [`OAuthSignIn`](components/OAuthSignIn.tsx) on the home and onboarding pages; **Sign out** on the hub.

## MVP Flow

- Landing → Onboarding → AI Learning Lab (forced quest) → Hub
- One quest template (input → output classification)
- Groq-powered generation with deterministic fallback
- MongoDB storage for seeded quests

## Environment Setup

Create a `.env.local` file (see `.env.local.example`) with:

- `AUTH_SECRET` (required for OAuth; generate with `openssl rand -base64 32`)
- `AUTH_URL` (production: `https://sage-x.vercel.app` or your app URL)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- `MONGODB_URI`
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional)
- `NEXT_PUBLIC_APP_URL` (used for invite links)
- `NEXT_PUBLIC_LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Sprite Sheet Generation

To build the 4x4 WASD sprite sheet for skin 1 from the animation frames:

```bash
npm run spritesheet:skin1
```

This outputs:

- `public/assests/skins/skin-1-spritesheet.png`
- `public/assests/skins/skin-1-spritesheet.json`

## Notes

- Backend follows the layered architecture in `BACKEND_RULES.md`.
- Quest generation uses deterministic seeds for fairness.

## Daily Vibe (API summary)

Vibe routes are included in [`/api/endpoints`](https://sage-x.vercel.app/api/endpoints) and [docs/sage-x-reference.md](docs/sage-x-reference.md). Quick list:

- `GET` / `POST` `/api/vibe/prompt` — today’s prompt (fetch or create)
- `POST` `/api/vibe/submissions` — submit a build
- `GET` `/api/vibe/submissions?promptId=...` — list submissions
- `GET` `/api/vibe/submissions/:id` — fetch a submission
- `POST` `/api/vibe/vote` — vote
- `GET` `/api/vibe/leaderboard?promptId=...` — leaderboard
- `GET` `/api/vibe/embed/:id` — embed metadata + iframe snippet

Use the production base URL above when calling the deployed API.
