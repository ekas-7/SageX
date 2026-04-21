# SageX AI Learning RPG MVP

SageX is a 2D RPG-style learning experience where players explore an AI city, complete quests, and unlock abilities as they master AI concepts.

## Deployment

- **Production:** [https://sage-x.vercel.app](https://sage-x.vercel.app)

## API & documentation

- **Machine-readable route list:** `GET` [https://sage-x.vercel.app/api/endpoints](https://sage-x.vercel.app/api/endpoints) — JSON with every path, HTTP methods, group, and full URLs (dynamic segments as `:id`).
- **Human-readable reference** (tables, links, notes): [docs/sage-x-reference.md](docs/sage-x-reference.md).
- **Source of truth for the catalog:** [`src/lib/apiEndpoints.ts`](src/lib/apiEndpoints.ts) — update this when you add or change routes under `app/api/`.

## Database schema (Mongoose)

- **Models:** [`src/models`](src/models).
- **Interactive ER diagram (local dev only):** with `npm run dev`, open [http://localhost:3000/dev/schema](http://localhost:3000/dev/schema). Not served in production.

## MVP Flow

- Landing → Onboarding → AI Learning Lab (forced quest) → Hub
- One quest template (input → output classification)
- Groq-powered generation with deterministic fallback
- MongoDB storage for seeded quests

## Environment Setup

Create a `.env.local` file (see `.env.local.example`) with:

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
