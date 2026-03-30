# ChatterAI — Dev Notes

## Commands

```bash
pnpm dev           # start dev server (localhost:3000)
pnpm build         # production build
pnpm lint          # ESLint
pnpm db:push       # push Drizzle schema to DB
pnpm db:studio     # open Drizzle Studio UI
pnpm db:generate   # generate migration files
pnpm db:migrate    # run migrations
pnpm seed          # seed database (lib/scripts/seed.ts)
```

## Architecture

- **Next.js App Router** — all routes live under `app/`. Route groups: `(auth)` and `(dashboard)`.
- **Drizzle ORM** — schema defined in `lib/db/`. Config in `drizzle.config.ts`. DB is Neon (serverless Postgres).
- **LangChain/LangGraph** — agent logic built with LangGraph graphs; supports Anthropic, OpenAI, and Google Gemini.
- **Vercel AI SDK** — used alongside LangChain for streaming responses.
- **Auth** — custom auth with bcryptjs password hashing, Nodemailer for OTP email flows.
- **Payments** — Razorpay for subscription billing.

## Widget Embedding

The embeddable chat widget (`components/floating-chat-ui.tsx`, `components/widget-chat-ui.tsx`) is served cross-origin. CORS headers are set in both `middleware.ts` and `vercel.json`. The `api/` routes handling widget traffic must always return proper CORS headers including on OPTIONS preflight.

## Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | CORS preflight handling for all `/api/` routes |
| `vercel.json` | Edge-level CORS headers |
| `drizzle.config.ts` | DB connection + migration config |
| `lib/scripts/seed.ts` | Database seeding script |
| `components/agents-popup.tsx` | Agent selection UI |
| `components/embed-code.tsx` | Widget embed snippet generator |

## Environment Variables

Required — see `.env.local`. Never commit secrets. Minimum needed for local dev:
- `DATABASE_URL` (Neon Postgres)
- At least one LLM key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`)
- `NEXTAUTH_SECRET` + `NEXTAUTH_URL`
- SMTP credentials for email flows
