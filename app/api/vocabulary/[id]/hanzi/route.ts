import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '../../../../../lib/prisma';

const DEFAULT_MODEL =
  process.env.OPENAI_VOCAB_HANZI_MODEL ??
  process.env.OPENAI_VOCAB_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_MODEL ??
  'gpt-4o-mini';

const hanziSchema = {
  name: 'hanzi_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['hanzi'],
    properties: {
      hanzi: {
        type: 'string',
        description:
          'The Chinese characters for the provided vocabulary word or phrase.',
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

    if (!vocab.pinyin && !vocab.english) {
      return NextResponse.json(
        { error: 'Vocabulary entry needs pinyin or English text' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const referenceText = vocab.pinyin || vocab.english;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: hanziSchema },
      messages: [
        {
          role: 'system',
          content:
            'You provide accurate simplified Chinese characters for given pinyin (with tone marks) or English glosses. Always respond with JSON matching the schema.',
        },
        {
          role: 'user',
          content: `Provide the simplified Chinese characters for this vocabulary entry: "${referenceText}". Return JSON with a single hanzi field.`,
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
      console.error('Failed to parse OpenAI hanzi response', error);
      return NextResponse.json(
        { error: 'OpenAI response parsing failed' },
        { status: 502 }
      );
    }

    const hanzi =
      typeof (parsed as { hanzi?: unknown }).hanzi === 'string'
        ? (parsed as { hanzi: string }).hanzi.trim()
        : '';

    if (!hanzi) {
      return NextResponse.json(
        { error: 'OpenAI did not return hanzi text' },
        { status: 502 }
      );
    }

    await prisma.vocabulary.update({
      where: { id: vocabId },
      data: { hanzi },
    });

    return NextResponse.json({ hanzi });
  } catch (error) {
    console.error('Error generating hanzi for vocabulary:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate hanzi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
