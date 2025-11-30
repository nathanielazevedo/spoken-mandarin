import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const lessonId = typeof body.lessonId === 'string' ? body.lessonId.trim() : '';
    const pinyin = typeof body.pinyin === 'string' ? body.pinyin.trim() : '';
    const english = typeof body.english === 'string' ? body.english.trim() : '';

    if (!lessonId || !pinyin || !english) {
      return NextResponse.json(
        { error: 'lessonId, pinyin, and english are required' },
        { status: 400 }
      );
    }

    const lessonExists = await prisma.lesson.count({
      where: { id: lessonId },
    });

    if (!lessonExists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const maxOrderResult = await prisma.vocabulary.aggregate({
      where: { lessonId },
      _max: { order: true },
    });

    const nextOrder =
      typeof maxOrderResult._max.order === 'number'
        ? maxOrderResult._max.order + 1
        : 0;

    const vocabulary = await prisma.vocabulary.create({
      data: {
        lessonId,
        pinyin,
        english,
        order: nextOrder,
      },
    });

    return NextResponse.json({
      id: vocabulary.id,
      pinyin: vocabulary.pinyin,
      english: vocabulary.english,
      hanzi: vocabulary.hanzi ?? undefined,
      audioUrl: vocabulary.audioUrl ?? undefined,
    });
  } catch (error) {
    console.error('Error creating vocabulary:', error);
    return NextResponse.json(
      { error: 'Failed to create vocabulary' },
      { status: 500 }
    );
  }
}
