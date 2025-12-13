import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const DEFAULT_MODEL =
  process.env.OPENAI_VOCAB_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_MODEL ??
  'gpt-4o-mini';

const translationSchema = {
  name: 'vocabulary_translation',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['pinyin', 'english'],
    properties: {
      pinyin: {
        type: 'string',
        description:
          'Chinese word or phrase written in standard Hanyu Pinyin with tone marks (no hanzi).',
      },
      english: {
        type: 'string',
        description:
          'Natural English word or phrase corresponding to the provided input.',
      },
    },
  },
};

export async function POST(request: Request) {
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

    const englishInput =
      typeof (body as { english?: unknown }).english === 'string'
        ? (body as { english: string }).english.trim()
        : '';

    const pinyinInput =
      typeof (body as { pinyin?: unknown }).pinyin === 'string'
        ? (body as { pinyin: string }).pinyin.trim()
        : '';

    if (!englishInput && !pinyinInput) {
      return NextResponse.json(
        { error: 'Provide either pinyin or English text' },
        { status: 400 }
      );
    }

    if (englishInput && pinyinInput) {
      return NextResponse.json(
        { error: 'Provide only one of pinyin or English' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = englishInput
      ? `Provide the Hanyu Pinyin (with tone marks, no hanzi) for this English word or phrase: "${englishInput}". Return JSON with both pinyin and english fields.`
      : `Provide a natural English translation for this Hanyu Pinyin word or phrase (no hanzi): "${pinyinInput}". Return JSON with both pinyin and english fields.`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      response_format: { type: 'json_schema', json_schema: translationSchema },
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful Chinese language tutor. Convert between English words/phrases and standard Hanyu Pinyin with tone marks, responding strictly as JSON.',
        },
        {
          role: 'user',
          content: prompt,
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
      console.error('Failed to parse OpenAI response', error);
      return NextResponse.json(
        { error: 'OpenAI response parsing failed' },
        { status: 502 }
      );
    }

    const pinyinResult =
      typeof (parsed as { pinyin?: unknown }).pinyin === 'string'
        ? (parsed as { pinyin: string }).pinyin.trim()
        : '';

    const englishResult =
      typeof (parsed as { english?: unknown }).english === 'string'
        ? (parsed as { english: string }).english.trim()
        : '';

    if (!pinyinResult || !englishResult) {
      return NextResponse.json(
        { error: 'OpenAI response missing translation data' },
        { status: 502 }
      );
    }

    return NextResponse.json({ pinyin: pinyinResult, english: englishResult });
  } catch (error) {
    console.error('Error generating vocabulary translation:', error);
    return NextResponse.json(
      { error: 'Failed to generate vocabulary translation' },
      { status: 500 }
    );
  }
}
