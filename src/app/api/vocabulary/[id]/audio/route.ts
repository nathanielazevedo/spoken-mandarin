import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { uploadAudioToStorage } from '@/lib/supabase/storage';

const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE ?? 'alloy';
const DEFAULT_MODEL = process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts';

const SUPPORTED_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'verse', 'ballad', 'ash', 'sage', 'marin', 'cedar']


const sanitizeVoiceList = (voices: string[] | undefined) => {
  if (!voices || !voices.length) {
    return [];
  }
  const filtered = voices
    .map((voice) => voice.trim())
    .filter((voice) => SUPPORTED_VOICES.includes(voice));
  return Array.from(new Set(filtered));
};

const AVAILABLE_VOICES = (() => {
  const envVoices = sanitizeVoiceList(
    process.env.OPENAI_TTS_VOICES?.split(',')
  );
  const baseVoices = envVoices.length ? envVoices : SUPPORTED_VOICES;
  const unique = Array.from(new Set(baseVoices));

  if (!unique.includes(DEFAULT_VOICE) && SUPPORTED_VOICES.includes(DEFAULT_VOICE)) {
    unique.unshift(DEFAULT_VOICE);
  }

  return unique.length ? unique : [DEFAULT_VOICE];
})();

const pickRandomVoice = () => {
  if (!AVAILABLE_VOICES.length) {
    return DEFAULT_VOICE;
  }
  const index = Math.floor(Math.random() * AVAILABLE_VOICES.length);
  return AVAILABLE_VOICES[index] ?? DEFAULT_VOICE;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

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
      select: {
        id: true,
        pinyin: true,
        hanzi: true,
        english: true,
        lessonId: true,
      },
    });

    if (!vocab) {
      return NextResponse.json({ error: 'Vocabulary not found' }, { status: 404 });
    }

    const speechInput = vocab.hanzi?.trim() || vocab.pinyin?.trim();

    if (!speechInput) {
      return NextResponse.json(
        { error: 'Vocabulary entry is missing hanzi and pinyin text' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const filename = `${vocab.id}.mp3`;

    const selectedVoice = pickRandomVoice();

    const prompt = `
    Read the following text in natural Mandarin with accurate tones.
    Speak clearly at a learner-friendly speed. Do not say anything but the text.

    Text: ${speechInput}
    `;

    const response = await client.audio.speech.create({
      model: DEFAULT_MODEL,
      voice: selectedVoice,
      response_format: 'mp3',
      input: prompt,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Upload to Supabase Storage
    const { publicUrl } = await uploadAudioToStorage(buffer, 'vocabulary', filename);
    const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

    await prisma.vocabulary.update({
      where: { id: vocabId },
      data: { audioUrl: cacheBustedUrl },
    });

    return NextResponse.json({ audioUrl: cacheBustedUrl, voice: selectedVoice });
  } catch (error) {
    console.error('Error generating vocabulary audio:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate audio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
