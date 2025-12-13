import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const DEFAULT_MODEL =
  process.env.OPENAI_SENTENCE_HANZI_MODEL ??
  process.env.OPENAI_VOCAB_HANZI_MODEL ??
  process.env.OPENAI_VOCAB_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_TRANSLATION_MODEL ??
  process.env.OPENAI_SENTENCE_MODEL ??
  'gpt-4o-mini';

const hanziSchema = {
  name: 'sentence_hanzi_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['hanzi'],
    properties: {
      hanzi: {
        type: 'string',
        description:
          'The simplified Chinese characters for the provided sentence.',
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
    const sentenceId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!sentenceId) {
      return NextResponse.json(
        { error: 'Sentence id is required' },
        { status: 400 }
      );
    }

    const sentence = await prisma.sentence.findUnique({
      where: { id: sentenceId },
      select: { id: true, pinyin: true, english: true, hanzi: true },
    });

    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }

    if (!sentence.pinyin && !sentence.english) {
      return NextResponse.json(
        { error: 'Sentence is missing reference text' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const referenceText = sentence.pinyin || sentence.english;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: hanziSchema },
      messages: [
        {
          role: 'system',
          content:
            'You convert provided Hanyu Pinyin (with tone marks) or English sentences into accurate simplified Chinese characters. Always respond with JSON that follows the schema.',
        },
        {
          role: 'user',
          content: `Provide the simplified Chinese characters for this sentence: "${referenceText}". Respond with JSON containing only the hanzi field.`,
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
      console.error('Failed to parse OpenAI sentence hanzi response', error);
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

    await prisma.sentence.update({
      where: { id: sentenceId },
      data: { hanzi },
    });

    return NextResponse.json({ hanzi });
  } catch (error) {
    console.error('Error generating hanzi for sentence:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate sentence hanzi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
