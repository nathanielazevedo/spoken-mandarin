# Mandarin Spoken

A beautiful, modern Mandarin Chinese learning app built with Next.js and React. Practice vocabulary, sentences, and pronunciation with an elegant glass-morphism UI featuring traditional Chinese-inspired design elements.

![Mandarin Spoken](public/background.svg)

## Features

### 📚 Lesson Management
- Create, edit, and organize Mandarin lessons
- Drag-and-drop reordering of vocabulary and sentences
- Bulk import from JSON files

### 🗣️ Vocabulary & Sentence Practice
- Flashcard-style learning with pinyin and English translations
- Audio playback with adjustable speed (0.5x - 2x)
- Text-to-speech for pronunciation guidance

### 🎤 Speech Recognition Practice
- Record your pronunciation and get instant feedback
- Powered by OpenAI Whisper for accurate Mandarin transcription
- Pinyin comparison to check tonal accuracy
- Section-level practice to work through all words/sentences

### 🎧 Listen Mode
- Play/pause/stop controls for audio
- Speed adjustment for listening practice
- Visual display of current word being played

### 🎨 Beautiful Design
- Glass-morphism UI with frosted card effects
- Traditional Chinese-inspired red wave background
- Light and dark mode support
- SF Pro system font for crisp typography
- Responsive design for all screen sizes

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Material UI (MUI) with custom theming
- **Language:** TypeScript
- **Drag & Drop:** @dnd-kit
- **Speech Recognition:** OpenAI Whisper API
- **Text-to-Speech:** OpenAI TTS API
- **Pinyin Processing:** pinyin-pro

## Prerequisites

- Node.js 20+
- npm 10+
- (Optional) OpenAI API key for speech recognition and audio generation

## Local Development

```bash
npm install
npm run dev
```

## Bulk Upload Vocabulary & Sentences

1. Create a `.json` file that contains optional `vocabulary` and `sentences` arrays. Each entry requires `pinyin` and `english`, with an optional `audioUrl` if you already have hosted audio.
2. Open any lesson in the app and click the **Bulk upload JSON** button near the lesson stats.
3. Pick your file in the dialog. The app validates the payload locally and pushes it to `/api/lessons/[id]/bulk`, appending items in the same order they appear in the file.

Example payload:

```json
{
  "vocabulary": [
    { "pinyin": "nǐ hǎo", "english": "hello" },
    { "pinyin": "xièxiè", "english": "thank you", "audioUrl": "/audio/lesson-01/v2.mp3" }
  ],
  "sentences": [
    { "pinyin": "nǐ hǎo ma?", "english": "How are you?" }
  ]
}
```

Any validation errors (missing fields, malformed JSON, etc.) are surfaced directly in the dialog so the file can be fixed before retrying.

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
