# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 15 application (App Router, TypeScript, Tailwind CSS 4). Standard commands are in `package.json`:

- **Dev server:** `npm run dev` (port 3000)
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Production start:** `npm start`

### Environment variables

Copy `.env.local.example` to `.env.local`. The only required variable is an AI API key (one of `AI_GATEWAY_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY`, `GOOGLE_API_KEY`, or `GEMINI_API_KEY`). Without it the UI loads and works but the `/api/generate` endpoint returns an auth error. The Neon Postgres `DATABASE_URL` is optional; history gracefully degrades to empty results without it.

### Non-obvious notes

- The default AI gateway URL is auto-detected from the key format: keys starting with `AIza` route to Google Gemini direct; all others default to Vercel AI Gateway (`https://ai-gateway.vercel.sh/v1`). Set `AI_GATEWAY_URL` explicitly to override.
- `next lint` is deprecated in Next.js 16+; the codebase uses ESLint flat config via `eslint.config.mjs`. The deprecation warning from `npm run lint` is cosmetic and does not affect results.
- There are no automated test suites in this repository (no `test` script in `package.json`).
