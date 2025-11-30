import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '../../../../../lib/prisma';

const DEFAULT_MODEL =
  process.env.OPENAI_VOCAB_VERIFICATION_MODEL ??
  process.env.OPENAI_VOCAB_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_MODEL ??
  'gpt-4o-mini';

const verificationSchema = {
  name: 'corrected_pinyin_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['pinyin', 'hanzi'],
    properties: {
      pinyin: {
        type: 'string',
        description:
          'The corrected Hanyu Pinyin with tone marks for the supplied vocabulary word. No hanzi characters.',
      },
      hanzi: {
        type: 'string',
        description:
          'The simplified Chinese characters that correspond to the provided word or phrase.',
      },
      notes: {
        type: 'string',
        description:
          'Optional short explanation about the correction (for example, tone adjustments).',
      },
    },
  },
};

export async function POST(
  _request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const params = await context.params;
    const rawId = params?.id;
    const vocabId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!vocabId) {
      return NextResponse.json(
        { error: 'Vocabulary id is required' },
        { status: 400 }
      );
    }

    const vocab = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
      select: { id: true, pinyin: true, english: true, hanzi: true },
    });

    if (!vocab) {
      return NextResponse.json(
        { error: 'Vocabulary entry not found' },
        { status: 404 }
      );
    }

    if (!vocab.english && !vocab.pinyin) {
      return NextResponse.json(
        { error: 'Vocabulary entry is missing reference text' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a meticulous Chinese language tutor. The learner provided the following Hanyu Pinyin (with tone marks): "${
      vocab.pinyin ?? ''
    }" for the word/phrase meaning "${
      vocab.english ?? ''
    }". Return JSON containing the correct standard Hanyu Pinyin with tone marks (no hanzi in that field) AND the corresponding simplified Chinese characters. If either is already correct, return it unchanged. Do not include additional commentary outside JSON.`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: verificationSchema },
      messages: [
        {
          role: 'system',
          content:
            'You verify Chinese vocabulary accuracy. Always answer with JSON matching the provided schema and only include Hanyu Pinyin with tone marks (no hanzi).',
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
      console.error('Failed to parse OpenAI verification response', error);
      return NextResponse.json(
        { error: 'OpenAI response parsing failed' },
        { status: 502 }
      );
    }

    const correctedPinyin =
      typeof (parsed as { pinyin?: unknown }).pinyin === 'string'
        ? (parsed as { pinyin: string }).pinyin.trim()
        : '';

    const correctedHanzi =
      typeof (parsed as { hanzi?: unknown }).hanzi === 'string'
        ? (parsed as { hanzi: string }).hanzi.trim()
        : '';

    const correctionNotes =
      typeof (parsed as { notes?: unknown }).notes === 'string'
        ? (parsed as { notes: string }).notes.trim()
        : undefined;

    if (!correctedPinyin || !correctedHanzi) {
      return NextResponse.json(
        { error: 'OpenAI did not return both pinyin and hanzi' },
        { status: 502 }
      );
    }

    await prisma.vocabulary.update({
      where: { id: vocabId },
      data: { pinyin: correctedPinyin, hanzi: correctedHanzi },
    });

    return NextResponse.json({
      pinyin: correctedPinyin,
      hanzi: correctedHanzi,
      previousPinyin: vocab.pinyin ?? null,
      previousHanzi: vocab.hanzi ?? null,
      notes: correctionNotes ?? null,
    });
  } catch (error) {
    console.error('Error verifying vocabulary pinyin:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to verify pinyin';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
