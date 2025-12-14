import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAdmin } from '@/lib/permissions-server';

const DEFAULT_MODEL =
  process.env.OPENAI_SENTENCE_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_MODEL ??
  'gpt-4o-mini';

const translationSchema = {
  name: 'sentence_translation',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['pinyin'],
    properties: {
      pinyin: {
        type: 'string',
        description:
          'Chinese sentence written in standard Hanyu Pinyin with tone marks (no hanzi).',
      },
      english: {
        type: 'string',
        description: 'Optional natural English translation or paraphrase.',
      },
    },
  },
};

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const english =
      typeof (body as { english?: unknown }).english === 'string'
        ? (body as { english: string }).english.trim()
        : '';

    if (!english) {
      return NextResponse.json(
        { error: 'English sentence is required' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.5,
      response_format: { type: 'json_schema', json_schema: translationSchema },
      messages: [
        {
          role: 'system',
          content:
            'You are a native Mandarin tutor helping learners express their ideas the way someone in China would naturally say them. Listen for intent, rewrite awkward English attempts into fluent, idiomatic Mandarin ideas, and output ONLY standard Hanyu Pinyin with tone marks (no hanzi). Always respond as strict JSON matching the schema.',
        },
        {
          role: 'user',
          content: `In natural Mainland Mandarin, how would a native speaker express the intent behind this sentence? Provide Hanyu Pinyin (tone marks, no hanzi) plus an optional English paraphrase explaining the nuance. Sentence: "${english}"`,
        },
      ],
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    const textContent = Array.isArray(rawContent)
      ? rawContent
          .map((part) => (typeof part === 'string' ? part : part?.text ?? ''))
          .join('')
      : rawContent ?? '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(textContent);
    } catch (error) {
      console.error('Failed to parse OpenAI translation', error);
      return NextResponse.json(
        { error: 'OpenAI response parsing failed' },
        { status: 502 }
      );
    }

    const pinyin =
      typeof (parsed as { pinyin?: unknown }).pinyin === 'string'
        ? (parsed as { pinyin: string }).pinyin.trim()
        : '';

    const translatedEnglish =
      typeof (parsed as { english?: unknown }).english === 'string'
        ? (parsed as { english: string }).english.trim() || english
        : english;

    if (!pinyin) {
      return NextResponse.json(
        { error: 'OpenAI response missing pinyin result' },
        { status: 502 }
      );
    }

    return NextResponse.json({ pinyin, english: translatedEnglish });
  } catch (error) {
    console.error('Error translating sentence:', error);
    return NextResponse.json(
      { error: 'Failed to translate sentence' },
      { status: 500 }
    );
  }
}
