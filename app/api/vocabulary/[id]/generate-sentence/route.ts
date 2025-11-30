import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '../../../../../lib/prisma';

const DEFAULT_MODEL = process.env.OPENAI_SENTENCE_MODEL ?? 'gpt-4o-mini';

const sentenceSchema = {
  name: 'sentence_suggestion',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['pinyin', 'english'],
    properties: {
      pinyin: {
        type: 'string',
        description:
          'Chinese sentence written purely in standard Hanyu Pinyin with tone marks (no hanzi).',
      },
      english: {
        type: 'string',
        description: 'Natural English translation of the sentence.',
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

    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
      select: {
        pinyin: true,
        english: true,
      },
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: 'Vocabulary item not found' },
        { status: 404 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      response_format: { type: 'json_schema', json_schema: sentenceSchema },
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful Chinese language tutor. Always respond with strict JSON that matches the provided schema.',
        },
        {
          role: 'user',
          content: `Create a short, natural Chinese sentence (max 12 words) that uses the vocabulary word "${vocabulary.pinyin}" meaning "${vocabulary.english}". Respond in JSON with fields pinyin (sentence in standard Hanyu Pinyin WITH tone marks, no hanzi) and english (natural English translation).`,
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
      console.error('Failed to parse OpenAI response as JSON:', error);
      return NextResponse.json(
        { error: 'OpenAI response parsing failed' },
        { status: 502 }
      );
    }

    const pinyin =
      typeof (parsed as { pinyin?: unknown }).pinyin === 'string'
        ? (parsed as { pinyin: string }).pinyin.trim()
        : '';
    const english =
      typeof (parsed as { english?: unknown }).english === 'string'
        ? (parsed as { english: string }).english.trim()
        : '';

    if (!pinyin || !english) {
      return NextResponse.json(
        { error: 'OpenAI response missing sentence content' },
        { status: 502 }
      );
    }

    return NextResponse.json({ pinyin, english });
  } catch (error) {
    console.error('Error generating AI sentence:', error);
    return NextResponse.json(
      { error: 'Failed to generate sentence' },
      { status: 500 }
    );
  }
}
