import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import OpenAI from 'openai';
import path from 'node:path';
import fs from 'node:fs/promises';

const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE ?? 'alloy';
const DEFAULT_MODEL = process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts';

export async function POST(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const vocabId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!vocabId) {
      return NextResponse.json({ error: 'Vocabulary id is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
    }

    const vocab = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
      select: { id: true, pinyin: true, english: true, lessonId: true },
    });

    if (!vocab) {
      return NextResponse.json({ error: 'Vocabulary not found' }, { status: 404 });
    }

    if (!vocab.pinyin) {
      return NextResponse.json({ error: 'Vocabulary entry is missing pinyin text' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const lessonFolder = vocab.lessonId || 'shared';
    const filename = `${vocab.id}.mp3`;
    const outputDir = path.join(process.cwd(), 'public', 'audio', lessonFolder);
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, filename);

    const response = await client.audio.speech.create({
      model: DEFAULT_MODEL,
      voice: DEFAULT_VOICE,
      response_format: 'mp3',
      input: vocab.pinyin,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    const publicUrl = path.posix.join('/audio', lessonFolder, filename);

    await prisma.vocabulary.update({
      where: { id: vocabId },
      data: { audioUrl: publicUrl },
    });

    return NextResponse.json({ audioUrl: publicUrl });
  } catch (error) {
    console.error('Error generating vocabulary audio:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate audio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
