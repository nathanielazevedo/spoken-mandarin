# Language Practice App

React + TypeScript + Vite app for Mandarin study sessions. Lessons mix vocabulary flashcards, timed typing drills, and guided conversations with validation hints.

## Prerequisites

- Node.js 20+
- npm 10+
- (Optional) OpenAI API key for pre-generating audio clips

## Local Development

```bash
npm install
npm run dev
```

## Pre-generating Lesson Audio with OpenAI

Use `scripts/generate-lesson-audio.mjs` to batch-create MP3 files for each vocabulary item via OpenAI TTS. Outputs land in `public/audio/<lessonId>` and can be referenced in lesson data.

### 1. Configure secrets

Create `.env.local` (ignored by git) with at least:

```
OPENAI_API_KEY=sk-YOUR_KEY
# optional overrides
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
OPENAI_TTS_DELAY_MS=1200
```

### 2. Run the generator

```bash
npm run generate:audio -- \
  --lesson src/data/lessons/lesson-01-introductions.json \
  --outDir public/audio/lesson-01
```

Flags:

- `--force` – regenerate even if files already exist
- `--count` – only process the first N vocabulary rows (helpful for smoke tests)
- `--voice` / `--model` – override defaults per run
- `--delay` – tweak throttling between API calls

Supported voices (per OpenAI docs at time of writing): `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, `coral`, `verse`, `ballad`, `ash`, `sage`, `marin`, `cedar`.

After completion the script prints a manifest you can paste into lesson JSON entries (e.g., `"audioUrl": "/audio/lesson-01/v1.mp3"`).

### 3. Serve files in the app

Files inside `public/` are automatically available at runtime. Once a lesson references `audioUrl`, components can replace synthesized playback with the static asset.

## Linting & Build

```bash
npm run lint
npm run build
```
