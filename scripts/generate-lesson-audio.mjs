#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const envFiles = [".env.local", ".env"];
const loadEnv = () => {
  for (const file of envFiles) {
    const envPath = path.resolve(projectRoot, file);
    dotenv.config({ path: envPath, override: false });
  }
};

loadEnv();

const DEFAULT_LESSON_PATH = "src/data/lessons/lesson-01-introductions.json";
const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE ?? "alloy";
const DEFAULT_MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
const DEFAULT_DELAY_MS = Number(process.env.OPENAI_TTS_DELAY_MS ?? 1200);

const usage = `
Usage: node scripts/generate-lesson-audio.mjs [options]

Options:
  --lesson <path>   Path to the lesson JSON (default: ${DEFAULT_LESSON_PATH})
  --outDir <path>   Output directory relative to project root (default: public/audio/<lessonId>)
  --force           Regenerate files even if they already exist
  --count <number>  Limit how many vocabulary entries to process (default: all)
  --voice <name>    OpenAI voice to use (default: ${DEFAULT_VOICE})
  --model <name>    OpenAI TTS model (default: ${DEFAULT_MODEL})
  --delay <ms>      Delay between requests to avoid rate limiting (default: ${DEFAULT_DELAY_MS})
  --help            Show this message
`;

const parseArgs = (rawArgs) => {
  const args = {
    lessonPath: DEFAULT_LESSON_PATH,
    force: false,
    outDir: null,
    voice: DEFAULT_VOICE,
    model: DEFAULT_MODEL,
    delay: DEFAULT_DELAY_MS,
    count: null,
  };
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    switch (arg) {
      case "--lesson":
        if (!rawArgs[i + 1]) throw new Error("Missing value for --lesson");
        args.lessonPath = rawArgs[i + 1];
        i += 1;
        break;
      case "--outDir":
        if (!rawArgs[i + 1]) throw new Error("Missing value for --outDir");
        args.outDir = rawArgs[i + 1];
        i += 1;
        break;
      case "--voice":
        if (!rawArgs[i + 1]) throw new Error("Missing value for --voice");
        args.voice = rawArgs[i + 1];
        i += 1;
        break;
      case "--count":
        if (!rawArgs[i + 1]) throw new Error("Missing value for --count");
        args.count = Number(rawArgs[i + 1]);
        if (!Number.isInteger(args.count) || args.count <= 0) {
          throw new Error("--count must be a positive integer");
        }
        i += 1;
        break;
      case "--model":
        if (!rawArgs[i + 1]) throw new Error("Missing value for --model");
        args.model = rawArgs[i + 1];
        i += 1;
        break;
      case "--delay":
        if (!rawArgs[i + 1]) throw new Error("Missing value for --delay");
        args.delay = Number(rawArgs[i + 1]);
        if (Number.isNaN(args.delay) || args.delay < 0) {
          throw new Error("--delay must be a positive number");
        }
        i += 1;
        break;
      case "--force":
        args.force = true;
        break;
      case "--help":
        console.info(usage);
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
};

const slugify = (value) =>
  value
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Set it in your environment or .env.local");
  }

  const lessonAbsolutePath = path.resolve(projectRoot, args.lessonPath);
  const lessonContent = await fs.readFile(lessonAbsolutePath, "utf8");
  const lesson = JSON.parse(lessonContent);

  if (!lesson?.id || !Array.isArray(lesson.vocabulary)) {
    throw new Error("Lesson file must include an id and a vocabulary array");
  }

  const lessonId = lesson.id;
  const outputDirRelative = args.outDir ?? path.join("public", "audio", lessonId);
  const outputDir = path.resolve(projectRoot, outputDirRelative);
  await fs.mkdir(outputDir, { recursive: true });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const manifest = [];
  const vocabulary = args.count ? lesson.vocabulary.slice(0, args.count) : lesson.vocabulary;

  if (args.count && lesson.vocabulary.length > vocabulary.length) {
    console.info(`Processing first ${vocabulary.length} of ${lesson.vocabulary.length} vocabulary entries.`);
  }

  for (const vocab of vocabulary) {
    const label = vocab.id ?? slugify(vocab.pinyin ?? vocab.english ?? "term");
    const filename = `${label}.mp3`;
    const filePath = path.join(outputDir, filename);
    const publicPath = path.posix.join("/audio", lessonId, filename);

    if (!args.force && (await fileExists(filePath))) {
      console.info(`Skipping ${label} (already exists)`);
      manifest.push({ id: vocab.id, audioUrl: publicPath });
      continue;
    }

    if (!vocab?.pinyin) {
      console.warn(`Skipping ${label} due to missing pinyin value.`);
      continue;
    }

    console.info(`Generating audio for ${label} → ${filename}`);
    const response = await client.audio.speech.create({
      model: args.model,
      voice: args.voice,
      format: "mp3",
      input: vocab.pinyin,
      language: "zh-CN",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    manifest.push({ id: vocab.id, audioUrl: publicPath });

    if (args.delay > 0) {
      await sleep(args.delay);
    }
  }

  console.info(`\nSaved ${manifest.length} audio files to ${outputDirRelative}`);
  console.info("Add these audioUrl values to your lesson data if needed:");
  console.info(JSON.stringify(manifest, null, 2));
};

main().catch((error) => {
  console.error("Audio generation failed:", error.message ?? error);
  process.exit(1);
});
