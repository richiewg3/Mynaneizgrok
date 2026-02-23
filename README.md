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
- `AI_GATEWAY_API_KEY` — Your Gemini API key

Optional:
- `DATABASE_URL` — Neon Postgres connection string for history

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Push this repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `AI_GATEWAY_API_KEY`
   - `DATABASE_URL` (optional, for history)
4. Deploy!

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Neon Postgres** (optional)
- **Gemini AI** (google/gemini-2.5-pro-preview)
