import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions-server';

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const lessonId = typeof body.lessonId === 'string' ? body.lessonId.trim() : '';
    const sentenceOrder = Array.isArray(body.sentenceOrder)
      ? body.sentenceOrder.filter((id: unknown): id is string => typeof id === 'string')
      : [];

    if (!lessonId || sentenceOrder.length === 0) {
      return NextResponse.json(
        { error: 'lessonId and sentenceOrder are required' },
        { status: 400 }
      );
    }

    const uniqueOrder = Array.from(new Set(sentenceOrder));
    if (uniqueOrder.length !== sentenceOrder.length) {
      return NextResponse.json(
        { error: 'Duplicate sentence ids detected' },
        { status: 400 }
      );
    }

    const sentenceEntries = await prisma.sentence.findMany({
      where: {
        lessonId,
        id: { in: sentenceOrder },
      },
      select: { id: true },
    });

    if (sentenceEntries.length !== sentenceOrder.length) {
      return NextResponse.json(
        { error: 'One or more sentences were not found for this lesson' },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      sentenceOrder.map((id: string, index: number) =>
        prisma.sentence.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering sentences:', error);
    return NextResponse.json(
      { error: 'Failed to reorder sentences' },
      { status: 500 }
    );
  }
}
