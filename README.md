# SageX — AI Learning RPG

SageX is a 2D RPG Space Academy where players learn AI engineering through gameplay, not lectures.

**Production:** [https://sage-x.vercel.app](https://sage-x.vercel.app)

---

## Vision

**Traditional learning is dead.**

Gen Z doesn't want another 40-minute tutorial — they want a high-stakes loop.

> **Attempt → Real-time LLM Grade → XP**

From AI engineering to finance, healthcare, design, and law — SageX is built to gamify AI learning across every field.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

---

## App flow

```
Landing (/) → Login (/login) → Onboarding (/onboarding) → Map (/map)
                                                         → Hub (/hub)
                                                         → AI Learning Lab (/lab)
                                                         → Arena (/arena)
                                                         → Ethics Center (/ethics)
                                                         → AI Investment News (/investment)
                                                         → Side Quests (/side-quests)
                                                         → AI Tools (/tools)
                                                         → Stats (/stats)
                                                         → Vibe (/vibe/*)
```

Post-login redirect goes to `/map`.

---

## Authentication

- **Provider:** Auth.js v5 (NextAuth) — [`auth.ts`](auth.ts), route `/api/auth/[...nextauth]`
- **OAuth providers:** Google and GitHub
- **Session:** JWT. `session.user.playerId` is the stable player ID exposed to the client.
- **Credentials:** callsign + password (bcrypt) for non-OAuth users.
- **Player mapping:** on OAuth sign-in, [`src/services/oauthPlayer.service.ts`](src/services/oauthPlayer.service.ts) finds or creates a `Player` document (keyed by `accountProvider` + `accountId`).
- **Client sync:** [`SessionSync`](components/SessionSync.tsx) mirrors the server session into `localStorage` on every page via `writeStoredPlayer`.
- **Route protection:** [`middleware.ts`](middleware.ts) (Edge-safe, no Mongo) redirects unauthenticated users to `/login`. Public paths are declared in [`src/lib/protectedRoutes.ts`](src/lib/protectedRoutes.ts):
  - **Exact public:** `/`, `/login`, `/investment`, `/ethics`, `/map`
  - **Prefix public:** `/onboarding`, `/vibe/embed/`, `/vibe/preview/`

### Health check

```
GET /api/health/auth
```

Returns `{ ok, githubOauth, googleOauth, authUrl, authSecret, mongo }` — booleans only, no secrets. Use to verify production env config without reading Vercel env vars directly.

---

## Player identity

Handled by [`src/lib/playerClient.ts`](src/lib/playerClient.ts) on the client.

| Function | Purpose |
|---|---|
| `readStoredPlayer()` | Read `sagex.player` from `localStorage`, apply defaults |
| `writeStoredPlayer(p)` | Persist player (normalises defaults before write) |
| `withPlayerDefaults(p)` | Fill in missing avatar / skill / interests |
| `signInPlayer(stored)` | Upsert to `POST /api/player`, fire-and-forget safe |
| `signInPlayerStrict(stored)` | Same, but throws if server doesn't confirm |
| `buildOnboardingPayload(fields)` | Create a fresh player at onboarding |

**localStorage keys:** `sagex.player` (JSON), `sagex.playerId` (plain string).

**Defaults** (from [`src/config/playerAppearance.ts`](src/config/playerAppearance.ts)):
- Avatar: `skin-1.png` (Orion) — enforced globally while cosmetics are paused
- Skill: `Beginner`
- Interests: `["product"]`

> `POST /api/player` always overwrites `avatar` to the default astronaut regardless of client payload — see [`src/controllers/player.controller.ts`](src/controllers/player.controller.ts).

---

## World map (`/map`)

- Tiled 4×6 chunked background (WASD / arrow keys, Shift to run).
- Player sprite: `skin-1` uses the animated spritesheet; other skins use static PNGs.
- Companion pet: [`petspritesheet.png`](public/assests/skins/petspritesheet.png) (4×4 sheet) renders below the player. Tune offsets and follow gap in [`src/config/mapPet.ts`](src/config/mapPet.ts).
- Collisions: [`src/data/mapCollisions.json`](src/data/mapCollisions.json).
- Building click / E-key zones navigate to the relevant page.
- **Alisa tour** is currently **disabled** (`ALISA_TOUR_ENABLED = false` in [`src/config/features.ts`](src/config/features.ts)). Set it to `true` to re-enable the first-visit NPC walkthrough and the "Replay Tour" button in the hub.

---

## Feature flags

Centrally managed in [`src/config/features.ts`](src/config/features.ts).

| Flag | Default | Effect |
|---|---|---|
| `ALISA_TOUR_ENABLED` | `false` | When `false`, Alisa's tour never starts and the hub hides the Replay button |

---

## Player appearance

Centrally managed in [`src/config/playerAppearance.ts`](src/config/playerAppearance.ts).

| Constant | Value |
|---|---|
| `DEFAULT_SAGEX_AVATAR_SRC` | `/assests/skins/skin-1.png` |
| `DEFAULT_SAGEX_AVATAR_DISPLAY_NAME` | `Orion` |

Changing these two constants updates avatar defaults everywhere: `playerClient`, `player.repo`, `oauthPlayer.service`, `auth.ts`, and the controller.

---

## AI Investment News (`/investment`)

After the intro video, renders the same 4×6 tiled map and WASD player movement as `/map`. Component: [`NewsMapPlayfield`](components/NewsMapPlayfield.tsx). Tiles: [`news_backgroung_chunks/`](public/assests/background/investement/news_backgroung_chunks/). Collisions: [`src/data/newsMapCollisions.json`](src/data/newsMapCollisions.json). Press **E** inside the news zone to open the news panel.

---

## Backend architecture

Strict layered architecture — never skip layers:

```
Route handler → Controller → Vali (Zod) → Orchestrator → Service → Repository → MongoDB
```

Full rules: [`BACKEND_RULES.md`](BACKEND_RULES.md).

| Layer | Folder | Naming |
|---|---|---|
| Route | `app/api/**/route.ts` | `route.ts` |
| Controller | `src/controllers/` | `*.controller.ts` |
| Validation | `src/vali/` | `*.vali.ts` |
| Orchestrator | `src/orchestrators/` | `*.orchestrator.ts` |
| Service | `src/services/` | `*.service.ts` |
| Repository | `src/repositories/` | `*.repo.ts` |
| Model | `src/models/` | `*.model.ts` |

---

## API routes

Machine-readable: `GET /api/endpoints`
Human-readable: [docs/sage-x-reference.md](docs/sage-x-reference.md)

| Group | Method | Path |
|---|---|---|
| Meta | GET | `/api/endpoints` |
| Health | GET | `/api/health/auth` |
| Auth | GET / POST | `/api/auth/[...nextauth]` |
| Player | POST | `/api/player` |
| Player | GET | `/api/player/check-name` |
| Player | POST | `/api/player/rehydrate` |
| Analytics | GET | `/api/analytics` |
| Arena | GET | `/api/arena/problems` |
| Arena | GET | `/api/arena/problem/[id]` |
| Arena | GET | `/api/arena/next` |
| Arena | POST | `/api/arena/submit` |
| LiveKit | POST | `/api/livekit/token` |
| OpenCode | POST | `/api/opencode` |
| Quests | GET | `/api/quests/first` |
| Stats | GET / POST | `/api/stats` |
| Vibe | GET / POST | `/api/vibe/prompt` |
| Vibe | GET / POST | `/api/vibe/submissions` |
| Vibe | GET | `/api/vibe/submissions/[id]` |
| Vibe | GET | `/api/vibe/embed/[id]` |
| Vibe | POST | `/api/vibe/vote` |
| Vibe | GET | `/api/vibe/leaderboard` |
| XP | POST | `/api/xp/award` |
| XP | GET | `/api/xp/summary` |
| Token | GET | `/api/token/quote` |

---

## Database

- **ORM:** Mongoose (MongoDB). All queries inside `src/repositories/` only.
- **Models:** [`src/models/`](src/models/)
- **Connection:** [`src/lib/db.ts`](src/lib/db.ts) — singleton cached connection with first-connect backfill (drops legacy `name_1` unique index, backfills `playerId` on old documents).
- **Interactive ER diagram (dev only):** `npm run dev` → [http://localhost:3000/dev/schema](http://localhost:3000/dev/schema). Hidden in production.

---

## Styling system

Design tokens and global utilities live in [`app/globals.css`](app/globals.css).

| Utility class | Purpose |
|---|---|
| `.glass-card` | Semi-transparent frosted card |
| `.glass-card-hover` | Hover lift + accent glow |
| `.surface-card` / `.surface-card-elevated` | Opaque surface variants |
| `.btn-primary` / `.btn-ghost` | Pill buttons |
| `.page-label` / `.page-title` / `.page-description` | Consistent page headers |
| `.section-label` | Small uppercase tag |
| `.tag` / `.tag-accent` | Pill badges |
| `.progress-fill` | Gradient XP / progress bar fill |
| `.back-link` | ← back navigation link |
| `.app-page` / `.app-page-inner` | Standard page shell + max-width wrapper |

**CSS variables (tokens):** `--sagex-accent`, `--surface-0…3`, `--border-*`, `--text-*` — defined in `:root`.

---

## Favicon

`app/favicon.ico` is a multi-size ICO (16 / 32 / 48 / 64 / 128 / 256 px) generated from `public/assests/logo.png`. Regenerate after a logo change:

```bash
npm run favicon
```

Script: [`scripts/generate-favicon.mjs`](scripts/generate-favicon.mjs). Requires `sharp` and `png-to-ico` (both in devDependencies).

`app/apple-icon.png` is a copy of the logo PNG used for Apple touch icons.

---

## npm scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local dev server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | ESLint |
| `favicon` | `node scripts/generate-favicon.mjs` | Regenerate `app/favicon.ico` |
| `spritesheet:skin1` | `node scripts/generate-skin1-spritesheet.mjs` | Rebuild animated skin-1 sprite sheet |
| `db:duplicates` | `tsx --env-file=.env.local scripts/audit-duplicate-player-names.ts` | Audit duplicate pilot callsigns in MongoDB |

---

## Environment variables

Create `.env.local` (see `.env.local.example`):

```env
# Auth (required)
AUTH_SECRET=                  # openssl rand -base64 32
AUTH_URL=                     # https://sage-x.vercel.app (production)

# OAuth providers
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Database
MONGODB_URI=

# AI
GROQ_API_KEY=
GROQ_MODEL=                   # optional, default: llama3-70b-8192

# App
NEXT_PUBLIC_APP_URL=          # used for invite links

# LiveKit (side quests)
NEXT_PUBLIC_LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# SAGEX token strip (optional — all three can be omitted)
NEXT_PUBLIC_SAGEX_TOKEN_MINT=
NEXT_PUBLIC_SAGEX_PUMP_URL=
NEXT_PUBLIC_SAGEX_DEX_SCREENER_URL=
NEXT_PUBLIC_SAGEX_TOKEN_LABEL=
```

---

## SAGEX AI token strip (optional)

Marketing-only surface for the community token — no wallet integration in-app.

- **UI:** [`SagexTokenStrip`](components/SagexTokenStrip.tsx) on the hub when any token env var is set.
- **Config:** [`src/config/sagexToken.ts`](src/config/sagexToken.ts) — reads the `NEXT_PUBLIC_*` vars above at build time.
- **Price proxy:** `GET /api/token/quote` — proxies DexScreener, server-cached. No on-chain calls.

---

## Daily Vibe

Community coding challenge — submit a build, vote, see leaderboard.

- `GET/POST /api/vibe/prompt` — fetch or create today's prompt
- `POST /api/vibe/submissions` — submit a build
- `GET /api/vibe/submissions?promptId=…` — list
- `GET /api/vibe/submissions/[id]` — single submission
- `POST /api/vibe/vote` — vote
- `GET /api/vibe/leaderboard?promptId=…` — leaderboard
- `GET /api/vibe/embed/[id]` — embed metadata + iframe snippet (public)
