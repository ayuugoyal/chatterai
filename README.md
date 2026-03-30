# ChatterAI

A full-stack platform for building and deploying embeddable AI chat agents — powered by LangChain, LangGraph, and multiple LLM providers.

## Features

- **Multi-model support** — Anthropic, OpenAI, Google Gemini via LangChain
- **Embeddable chat widget** — drop a script tag into any site to launch your agent
- **Agent builder** — create, configure, and manage multiple AI agents from a dashboard
- **Authentication** — email/password with OTP email verification and password reset
- **Billing** — Razorpay integration for subscription management
- **Shopify integration** — connect agents to Shopify stores
- **Demo chat** — public demo page for testing agents without login

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM |
| AI | LangChain, LangGraph, Vercel AI SDK |
| Payments | Razorpay |
| Animations | Framer Motion |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (Neon recommended)

### Installation

```bash
git clone https://github.com/ayuugoyal/chatterai.git
cd chatterai
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=your_neon_postgres_url

# LLM Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Database Setup

```bash
pnpm db:push      # push schema to database
pnpm db:studio    # open Drizzle Studio
pnpm seed         # seed initial data
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/          # sign-in, sign-up, verify-email, password reset
  (dashboard)/     # agents, billing, dashboard
  api/             # REST + streaming API routes
  chat/            # full-page chat UI
  demo-chat/       # public demo chat
components/
  home/            # landing page sections
  ui/              # shadcn/ui primitives
  agents-popup.tsx
  floating-chat-ui.tsx
  widget-chat-ui.tsx
lib/               # db, auth helpers, scripts
hooks/             # custom React hooks
```

## Deployment

The project includes a `vercel.json` with CORS headers configured for cross-origin widget embedding. Deploy with:

```bash
vercel deploy
```

## License

MIT
