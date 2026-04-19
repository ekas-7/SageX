# SageX — AI Learning RPG MVP

SageX is a 2D RPG-style learning experience where players explore an AI city, complete quests, and unlock abilities as they master AI concepts.

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

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Backend follows the layered architecture in `BACKEND_RULES.md`.
- Quest generation uses deterministic seeds for fairness.
