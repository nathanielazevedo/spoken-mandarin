import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { uploadAudioToStorage } from '@/lib/supabase/storage';

const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE ?? 'alloy';
const DEFAULT_MODEL = process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts';

const SUPPORTED_VOICES = [
  'alloy',
  // 'echo',
  'fable',
  'onyx',
  // 'nova',
  // 'shimmer',
  'coral',
  'verse',
  'ballad',
  'ash',
  // 'sage',
  'marin',
  'cedar',
];

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
  context: { params: Promise<{ id?: string | string[] }> }
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const sentenceId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!sentenceId) {
      return NextResponse.json({ error: 'Sentence id is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
    }

    const sentence = await prisma.sentence.findUnique({
      where: { id: sentenceId },
      select: { id: true, lessonId: true, pinyin: true, hanzi: true },
    });

    if (!sentence) {
      return NextResponse.json({ error: 'Sentence not found' }, { status: 404 });
    }

    const speechInput = sentence.hanzi?.trim() || sentence.pinyin?.trim();

    if (!speechInput) {
      return NextResponse.json(
        { error: 'Sentence is missing hanzi and pinyin text' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const filename = `${sentence.id}.mp3`;

    const selectedVoice = pickRandomVoice();

    const prompt = `
    Read the following sentence in natural Mandarin with accurate tones.
    Speak clearly at a learner-friendly pace. Only say the provided text.

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
    const { publicUrl } = await uploadAudioToStorage(buffer, 'sentences', filename);
    const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

    await prisma.sentence.update({
      where: { id: sentenceId },
      data: { audioUrl: cacheBustedUrl },
    });

    return NextResponse.json({ audioUrl: cacheBustedUrl, voice: selectedVoice });
  } catch (error) {
    console.error('Error generating sentence audio:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate audio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
