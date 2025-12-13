import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const vocabularyOrder = Array.isArray(body.vocabularyOrder)
      ? body.vocabularyOrder.filter((id: unknown): id is string => typeof id === 'string')
      : [];

    if (!lessonId || vocabularyOrder.length === 0) {
      return NextResponse.json(
        { error: 'lessonId and vocabularyOrder are required' },
        { status: 400 }
      );
    }

    const uniqueOrder = Array.from(new Set(vocabularyOrder));
    if (uniqueOrder.length !== vocabularyOrder.length) {
      return NextResponse.json(
        { error: 'Duplicate vocabulary ids detected' },
        { status: 400 }
      );
    }

    const vocabEntries = await prisma.vocabulary.findMany({
      where: {
        lessonId,
        id: { in: vocabularyOrder },
      },
      select: { id: true, order: true },
    });

    if (vocabEntries.length !== vocabularyOrder.length) {
      return NextResponse.json(
        { error: 'One or more vocabulary items were not found for this lesson' },
        { status: 400 }
      );
    }

    const orderMap = new Map(vocabEntries.map((entry) => [entry.id, entry.order ?? 0]));
    const updates = vocabularyOrder
      .map((id: string, index: number) => ({ id, order: index }))
      .filter(({ id, order }) => orderMap.get(id) !== order);

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    const CHUNK_SIZE = 25;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction(
        chunk.map(({ id, order }) =>
          prisma.vocabulary.update({
            where: { id },
            data: { order },
          })
        ),
        { timeout: 15000 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering vocabulary:', error);
    return NextResponse.json(
      { error: 'Failed to reorder vocabulary' },
      { status: 500 }
    );
  }
}
