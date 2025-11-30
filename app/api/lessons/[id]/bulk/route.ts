import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

type RawBulkEntry = {
  pinyin?: unknown;
  english?: unknown;
  audioUrl?: unknown;
};

type NormalizedBulkEntry = {
  pinyin: string;
  english: string;
  audioUrl?: string;
};

const normalizeBulkEntries = (
  entries: RawBulkEntry[],
  label: 'vocabulary' | 'sentences'
): NormalizedBulkEntry[] => {
  return entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Invalid ${label} entry at index ${index}`);
    }

    const pinyin = typeof entry.pinyin === 'string' ? entry.pinyin.trim() : '';
    const english = typeof entry.english === 'string' ? entry.english.trim() : '';
    const audioUrl = typeof entry.audioUrl === 'string' ? entry.audioUrl.trim() : '';

    if (!pinyin || !english) {
      throw new Error(
        `Each ${label} entry must include non-empty pinyin and english (issue at index ${index}).`
      );
    }

    return {
      pinyin,
      english,
      audioUrl: audioUrl || undefined,
    };
  });
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const lessonId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson id is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const rawVocabulary = Array.isArray((body as { vocabulary?: RawBulkEntry[] }).vocabulary)
      ? (body as { vocabulary: RawBulkEntry[] }).vocabulary
      : [];
    const rawSentences = Array.isArray((body as { sentences?: RawBulkEntry[] }).sentences)
      ? (body as { sentences: RawBulkEntry[] }).sentences
      : [];

    if (rawVocabulary.length === 0 && rawSentences.length === 0) {
      return NextResponse.json(
        { error: 'Provide at least one vocabulary or sentence entry to import.' },
        { status: 400 }
      );
    }

    let normalizedVocabulary: NormalizedBulkEntry[] = [];
    let normalizedSentences: NormalizedBulkEntry[] = [];

    try {
      normalizedVocabulary = normalizeBulkEntries(rawVocabulary, 'vocabulary');
      normalizedSentences = normalizeBulkEntries(rawSentences, 'sentences');
    } catch (validationError) {
      return NextResponse.json(
        { error: (validationError as Error).message },
        { status: 400 }
      );
    }

    const { createdVocabulary, createdSentences } = await prisma.$transaction(
      async (tx) => {
        const lessonExists = await tx.lesson.count({ where: { id: lessonId } });
        if (!lessonExists) {
          throw new Error('LESSON_NOT_FOUND');
        }

        let nextVocabularyOrder = 0;
        let nextSentenceOrder = 0;

        if (normalizedVocabulary.length) {
          const maxVocabOrder = await tx.vocabulary.aggregate({
            where: { lessonId },
            _max: { order: true },
          });
          nextVocabularyOrder =
            typeof maxVocabOrder._max.order === 'number'
              ? maxVocabOrder._max.order + 1
              : 0;
        }

        if (normalizedSentences.length) {
          const maxSentenceOrder = await tx.sentence.aggregate({
            where: { lessonId },
            _max: { order: true },
          });
          nextSentenceOrder =
            typeof maxSentenceOrder._max.order === 'number'
              ? maxSentenceOrder._max.order + 1
              : 0;
        }

        const vocabularyData = normalizedVocabulary.map((entry, index) => ({
          lessonId,
          pinyin: entry.pinyin,
          english: entry.english,
          audioUrl: entry.audioUrl ?? null,
          order: nextVocabularyOrder + index,
        }));

        if (vocabularyData.length) {
          await tx.vocabulary.createMany({ data: vocabularyData });
        }

        const sentencesData = normalizedSentences.map((entry, index) => ({
          lessonId,
          pinyin: entry.pinyin,
          english: entry.english,
          audioUrl: entry.audioUrl ?? null,
          order: nextSentenceOrder + index,
        }));

        if (sentencesData.length) {
          await tx.sentence.createMany({ data: sentencesData });
        }

        const createdVocabulary = vocabularyData.length
          ? await tx.vocabulary.findMany({
              where: {
                lessonId,
                order: {
                  gte: nextVocabularyOrder,
                  lt: nextVocabularyOrder + vocabularyData.length,
                },
              },
              orderBy: { order: 'asc' },
            })
          : [];

        const createdSentences = sentencesData.length
          ? await tx.sentence.findMany({
              where: {
                lessonId,
                order: {
                  gte: nextSentenceOrder,
                  lt: nextSentenceOrder + sentencesData.length,
                },
              },
              orderBy: { order: 'asc' },
            })
          : [];

        return { createdVocabulary, createdSentences };
      }
    );

    return NextResponse.json({
      lessonId,
      created: {
        vocabulary: createdVocabulary,
        sentences: createdSentences,
      },
      counts: {
        vocabulary: createdVocabulary.length,
        sentences: createdSentences.length,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'LESSON_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    console.error('Error performing bulk upload:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}
