# Grok Prompt Architect — Img2Vid Master

An AI-powered prompt engineering tool that transforms your starter frames into optimized Grok 10-second Image-to-Video generation prompts.

## Features

- **Multi-Image Upload**: Upload 1-5 starter frame images
- **Per-Image Descriptions**: Each image gets its own text input for your video concept
- **AI-Powered Optimization**: Uses Gemini AI with specialized Grok Img2Vid system instructions
- **Copy-Ready Output**: One-click copy buttons for generated prompts
- **Theme Modes**: Dark, Light, and Party mode (Easter egg!)
- **Mobile Responsive**: Fully optimized for mobile devices
- **History Tracking**: Optional Postgres database for prompt history

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy the example env file and fill in your API key:

```bash
cp .env.local.example .env.local
```

Required:
- API key (first available value is used):
  - `AI_GATEWAY_API_KEY`
  - `VERCEL_AI_GATEWAY_API_KEY`
  - `GOOGLE_API_KEY`
  - `GEMINI_API_KEY`

Optional:
- `AI_MODEL` — Model name (defaults to `google/gemini-3.1-pro-preview`)
- `AI_GATEWAY_URL` — API gateway base URL
- `VERCEL_AI_GATEWAY_URL` — alias for gateway base URL
- `DATABASE_URL` — Neon Postgres connection string for history

Default gateway behavior:
- If `AI_GATEWAY_URL`/`VERCEL_AI_GATEWAY_URL` is set, that URL is used.
- If gateway URL is not set and the key looks like a Google key (`AIza...`), the app uses Google Gemini direct API.
- If gateway URL is not set and the key is non-Google, the app defaults to Vercel AI Gateway (`https://ai-gateway.vercel.sh/v1`).

Key/gateway pairing:
- For Google Gemini direct (`AI_GATEWAY_URL` omitted or set to `https://generativelanguage.googleapis.com/v1beta`), use a Google AI Studio key (usually starts with `AIza`).
- For Vercel AI Gateway, set `AI_GATEWAY_URL` (or `VERCEL_AI_GATEWAY_URL`) to `https://ai-gateway.vercel.sh/v1` and use your Vercel AI Gateway API key.
- For OpenRouter or other OpenAI-compatible providers (keys often start with `sk-`), set `AI_GATEWAY_URL` to that provider endpoint.

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Troubleshooting

### `API_KEY_INVALID` from `generativelanguage.googleapis.com`

This usually means the key and gateway URL do not match:

- Google endpoint + OpenRouter/OpenAI key (`sk-...`) -> invalid key
- Google endpoint + Vercel AI Gateway key -> invalid key
- Fix: either use a Google AI Studio key, or change `AI_GATEWAY_URL` to your provider (for example Vercel: `https://ai-gateway.vercel.sh/v1` or OpenRouter: `https://openrouter.ai/api/v1`)

## Deployment on Vercel

1. Push this repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `AI_GATEWAY_API_KEY` (or `VERCEL_AI_GATEWAY_API_KEY`)
   - `AI_GATEWAY_URL=https://ai-gateway.vercel.sh/v1` (recommended for explicit config)
   - `DATABASE_URL` (optional, for history)
4. Deploy!

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Neon Postgres** (optional)
- **Gemini AI** (google/gemini-2.5-pro-preview)
