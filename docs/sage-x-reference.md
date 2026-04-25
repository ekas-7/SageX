# Sage-X quick reference

**Deployed app:** [https://sage-x.vercel.app](https://sage-x.vercel.app)

## Machine-readable API catalog

**`GET`** [https://sage-x.vercel.app/api/endpoints](https://sage-x.vercel.app/api/endpoints)

Returns JSON: `origin`, `endpoints` (path, methods, group, `url`), plus `database` (Mongo `Player` + OAuth fields) and `auth` (Auth.js base path, providers).  
Source of truth: [`src/lib/apiEndpoints.ts`](../src/lib/apiEndpoints.ts) and [`src/lib/dbSchemaMetadata.ts`](../src/lib/dbSchemaMetadata.ts).

## DB schema (Mongoose)

- Models live in [`src/models`](../src/models). **Player** includes optional **OAuth** fields: `email` (unique sparse), `accountProvider`, `accountId` (compound unique with provider when set).
- **Interactive ER diagram (local only):** run `npm run dev`, then open [http://localhost:3000/dev/schema](http://localhost:3000/dev/schema).  
  Production builds hide this page (`NODE_ENV === "production"` → 404).

## Backend API (human table)

Base URL: `https://sage-x.vercel.app`

| Area | Method & path |
|------|----------------|
| Meta | `GET` [`/api/endpoints`](https://sage-x.vercel.app/api/endpoints) |
| Auth | `GET` / `POST` [`/api/auth/[...nextauth]`](https://sage-x.vercel.app/api/auth) (Auth.js v5: Google, GitHub) |
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
| Token | `GET` [`/api/token/quote`](https://sage-x.vercel.app/api/token/quote) |

Replace `:id` / `example-id` with real IDs where routes are dynamic.

## SAGEX AI (Solana) — optional

- **UI:** `SagexTokenStrip` on the landing and hub pages if [`getSagexTokenPublic()`](../src/config/sagexToken.ts) is configured (mint and/or link overrides). Source: [`src/config/sagexToken.ts`](../src/config/sagexToken.ts), [`components/SagexTokenStrip.tsx`](../components/SagexTokenStrip.tsx).
- **Env (public, build):** `NEXT_PUBLIC_SAGEX_TOKEN_MINT`, optional `NEXT_PUBLIC_SAGEX_PUMP_URL`, `NEXT_PUBLIC_SAGEX_DEX_SCREENER_URL`, `NEXT_PUBLIC_SAGEX_TOKEN_LABEL` — see [`.env.local.example`](../.env.local.example).
- **Quote API:** `GET` `/api/token/quote` — optional `?mint=`; default mint from `NEXT_PUBLIC_SAGEX_TOKEN_MINT`. Proxies [DexScreener](https://api.dexscreener.com/) latest price (cached on the server). No wallet or chain signing.

## World map

- **Page:** [`/map`](../app/map/page.tsx) — tiled background, building zones, collisions in [`src/data/mapCollisions.json`](../src/data/mapCollisions.json).
- **Player:** skin **1** uses [`skin-1-spritesheet.png`](../public/assests/skins/skin-1-spritesheet.png); other skins use static PNGs from onboarding.
- **Companion pet:** [`petspritesheet.png`](../public/assests/skins/petspritesheet.png) (4×4 sheet), draw order under the player; behavior and layout constants in [`src/config/mapPet.ts`](../src/config/mapPet.ts) (offsets, `MAP_PET_HORIZ_FLIP` for which walk direction is mirrored, follow gap, display width).
- **Tour:** [`AlisaTour`](../components/AlisaTour.tsx) (optional guided walkthrough).
- **Investment & AI news:** [`/investment`](../app/investment/page.tsx) — after the intro video, the scene uses the same 4×6 grid and player controls as [`/map`](../app/map/page.tsx) ([`news_backgroung_chunks/`](../public/assests/background/investement/news_backgroung_chunks/) + [`NewsMapPlayfield`](../components/NewsMapPlayfield.tsx)).
