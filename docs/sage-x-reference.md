# Sage-X quick reference

**Deployed app:** [https://sage-x.vercel.app](https://sage-x.vercel.app)

---

## Machine-readable API catalog

```
GET https://sage-x.vercel.app/api/endpoints
```

Returns JSON: `origin`, `endpoints` (path, methods, group, `url`), plus `database` (Mongo `Player` + OAuth fields) and `auth` (Auth.js base path, providers).
Source of truth: [`src/lib/apiEndpoints.ts`](../src/lib/apiEndpoints.ts) and [`src/lib/dbSchemaMetadata.ts`](../src/lib/dbSchemaMetadata.ts).

---

## Backend API (human table)

Base URL: `https://sage-x.vercel.app`

| Group | Method | Path |
|-------|--------|------|
| Meta | `GET` | [`/api/endpoints`](https://sage-x.vercel.app/api/endpoints) |
| Health | `GET` | `/api/health/auth` |
| Auth | `GET` / `POST` | `/api/auth/[...nextauth]` (Auth.js v5: Google, GitHub) |
| Player | `POST` | `/api/player` |
| Player | `GET` | `/api/player/check-name` |
| Player | `POST` | `/api/player/rehydrate` |
| Analytics | `GET` | `/api/analytics` |
| Arena | `GET` | `/api/arena/problems` |
| Arena | `GET` | `/api/arena/problem/:id` |
| Arena | `GET` | `/api/arena/next` |
| Arena | `POST` | `/api/arena/submit` |
| LiveKit | `POST` | `/api/livekit/token` |
| OpenCode | `POST` | `/api/opencode` |
| Quests | `GET` | `/api/quests/first` |
| Stats | `GET` / `POST` | `/api/stats` |
| Vibe | `GET` / `POST` | `/api/vibe/prompt` |
| Vibe | `POST` | `/api/vibe/submissions` |
| Vibe | `GET` | `/api/vibe/submissions` |
| Vibe | `GET` | `/api/vibe/submissions/:id` |
| Vibe | `GET` | `/api/vibe/embed/:id` |
| Vibe | `POST` | `/api/vibe/vote` |
| Vibe | `GET` | `/api/vibe/leaderboard` |
| XP | `POST` | `/api/xp/award` |
| XP | `GET` | `/api/xp/summary` |
| Token | `GET` | `/api/token/quote` |

Replace `:id` with a real document ID where routes are dynamic.

---

## Health check

```
GET /api/health/auth
```

Safe production diagnostic — never exposes secret values.

```json
{
  "ok": true,
  "githubOauth": "ok",
  "googleOauth": "ok",
  "authUrl": true,
  "authSecret": true,
  "mongo": true,
  "expectedGitHubCallbackPath": "/api/auth/callback/github"
}
```

`githubOauth` / `googleOauth` values: `"ok"` | `"missing_id"` | `"missing_secret"` | `"missing_both"`.

Source: [`app/api/health/auth/route.ts`](../app/api/health/auth/route.ts).

---

## DB schema (Mongoose)

- Models: [`src/models/`](../src/models). **Player** includes optional **OAuth** fields: `email` (unique sparse), `accountProvider`, `accountId` (compound unique with provider when set).
- **Interactive ER diagram (local only):** `npm run dev` → [http://localhost:3000/dev/schema](http://localhost:3000/dev/schema). Returns 404 in production.

---

## Authentication

- **Providers:** Google, GitHub, Credentials (callsign + password).
- **Required env vars:** `AUTH_SECRET`, `AUTH_URL` (production), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
- **OAuth callback URL (GitHub):** `https://sage-x.vercel.app/api/auth/callback/github`
- **Post-login redirect:** `/map`.
- **Session:** JWT — `session.user.playerId` is the stable cross-device player ID.

---

## Player identity (client-side)

Managed by [`src/lib/playerClient.ts`](../src/lib/playerClient.ts).

- **`localStorage` keys:** `sagex.player` (full JSON), `sagex.playerId` (plain UUID).
- **`withPlayerDefaults(p)`** fills missing fields from [`src/config/playerAppearance.ts`](../src/config/playerAppearance.ts) before any read or write.
- **OAuth new users:** `/map` detects a missing local profile and seeds `localStorage` from `session.user`.
- **Avatar enforcement:** `POST /api/player` and `createWithOAuth` in `player.repo.ts` always force `avatar = DEFAULT_SAGEX_AVATAR_SRC` (Orion / skin-1).

---

## Feature flags

[`src/config/features.ts`](../src/config/features.ts)

| Flag | Default | Effect |
|------|---------|--------|
| `ALISA_TOUR_ENABLED` | `false` | Disables Alisa NPC walkthrough everywhere; hides hub "Replay Tour" button |

---

## Player appearance defaults

[`src/config/playerAppearance.ts`](../src/config/playerAppearance.ts)

| Constant | Value |
|----------|-------|
| `DEFAULT_SAGEX_AVATAR_SRC` | `/assests/skins/skin-1.png` |
| `DEFAULT_SAGEX_AVATAR_DISPLAY_NAME` | `Orion` |

---

## World map (`/map`)

- Tiled background (chunked), WASD / arrows, Shift to run.
- Collision data: [`src/data/mapCollisions.json`](../src/data/mapCollisions.json).
- Skin 1 → animated `skin-1-spritesheet.png`; other skins → static PNG.
- Companion pet: [`petspritesheet.png`](../public/assests/skins/petspritesheet.png) (4×4 sheet). Config: [`src/config/mapPet.ts`](../src/config/mapPet.ts).
- Alisa tour controlled by `ALISA_TOUR_ENABLED` flag.

---

## Investment / AI news (`/investment`)

After intro video, renders a 4×6 tiled map with WASD movement ([`NewsMapPlayfield`](../components/NewsMapPlayfield.tsx)). Tiles: `news_backgroung_chunks/`. Collisions: [`src/data/newsMapCollisions.json`](../src/data/newsMapCollisions.json). Blocked areas styled with `--border-accent` / `--sagex-accent-muted`.

---

## Favicon

`app/favicon.ico` — multi-size ICO (16/32/48/64/128/256 px) built from `public/assests/logo.png`.
`app/apple-icon.png` — PNG copy of logo for Apple touch icon.

To regenerate after a logo change:

```bash
npm run favicon
```

Script: [`scripts/generate-favicon.mjs`](../scripts/generate-favicon.mjs).

---

## SAGEX AI (Solana) — optional

Marketing-only token surface; no wallet integration in-app.

- **UI:** [`SagexTokenStrip`](../components/SagexTokenStrip.tsx) on the hub when any token env var is set.
- **Config:** [`src/config/sagexToken.ts`](../src/config/sagexToken.ts) — reads `NEXT_PUBLIC_SAGEX_TOKEN_MINT`, optional `NEXT_PUBLIC_SAGEX_PUMP_URL`, `NEXT_PUBLIC_SAGEX_DEX_SCREENER_URL`, `NEXT_PUBLIC_SAGEX_TOKEN_LABEL`.
- **Price proxy:** `GET /api/token/quote` — proxies DexScreener (server-cached).

---

## Sprite sheet generation

```bash
npm run spritesheet:skin1   # → public/assests/skins/skin-1-spritesheet.{png,json}
```

The mecha pet sheet (`petspritesheet.png`) is hand-authored and not generated by this script.
