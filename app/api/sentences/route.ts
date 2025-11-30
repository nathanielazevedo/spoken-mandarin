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
    const requestedPosition =
      typeof body.insertPosition === 'number' && Number.isInteger(body.insertPosition)
        ? body.insertPosition
        : undefined;

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

    const sentenceCount = await prisma.sentence.count({
      where: { lessonId },
    });

    const insertPosition = typeof requestedPosition === 'number'
      ? Math.min(Math.max(requestedPosition, 0), sentenceCount)
      : sentenceCount;

    const createResult = await prisma.$transaction(async (tx) => {
      if (insertPosition < sentenceCount) {
        await tx.sentence.updateMany({
          where: {
            lessonId,
            order: {
              gte: insertPosition,
            },
          },
          data: {
            order: {
              increment: 1,
            },
          },
        });
      }

      return tx.sentence.create({
        data: {
          lessonId,
          pinyin,
          english,
          order: insertPosition,
        },
      });
    });

    return NextResponse.json({
      id: createResult.id,
      pinyin: createResult.pinyin,
      english: createResult.english,
      audioUrl: createResult.audioUrl ?? undefined,
      order: createResult.order,
    });
  } catch (error) {
    console.error('Error creating sentence:', error);
    return NextResponse.json(
      { error: 'Failed to create sentence' },
      { status: 500 }
    );
  }
}
