import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions-server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const params = await context.params;
    const rawId = params?.id;
    const vocabId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!vocabId) {
      return NextResponse.json(
        { error: 'Vocabulary id is required' },
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

    const data: { pinyin?: string; english?: string; hanzi?: string | null; lessonId?: string; order?: number } = {};

    if (typeof (body as { lessonId?: unknown }).lessonId === 'string') {
      const trimmed = (body as { lessonId: string }).lessonId.trim();
      if (trimmed) {
        // Verify the target lesson exists
        const targetLesson = await prisma.lesson.findUnique({ where: { id: trimmed } });
        if (!targetLesson) {
          return NextResponse.json({ error: 'Target lesson not found' }, { status: 404 });
        }
        data.lessonId = trimmed;
        // Get the max order in the target lesson to append at the end
        const maxOrder = await prisma.vocabulary.aggregate({
          where: { lessonId: trimmed },
          _max: { order: true },
        });
        data.order = (maxOrder._max.order ?? -1) + 1;
      }
    }

    if (typeof (body as { pinyin?: unknown }).pinyin === 'string') {
      const trimmed = (body as { pinyin: string }).pinyin.trim();
      if (trimmed) {
        data.pinyin = trimmed;
      }
    }

    if (typeof (body as { english?: unknown }).english === 'string') {
      const trimmed = (body as { english: string }).english.trim();
      if (trimmed) {
        data.english = trimmed;
      }
    }

    if (typeof (body as { hanzi?: unknown }).hanzi === 'string') {
      const trimmed = (body as { hanzi: string }).hanzi.trim();
      data.hanzi = trimmed || null;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json(
        { error: 'Provide at least one field to update' },
        { status: 400 }
      );
    }

    const updated = await prisma.vocabulary.update({
      where: { id: vocabId },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      pinyin: updated.pinyin,
      english: updated.english,
      hanzi: updated.hanzi ?? undefined,
      audioUrl: updated.audioUrl ?? undefined,
    });
  } catch (error: any) {
    console.error('Error updating vocabulary:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Vocabulary not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update vocabulary' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const params = await context.params;
    const rawId = params?.id;
    const vocabId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!vocabId) {
      return NextResponse.json(
        { error: 'Vocabulary id is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.vocabulary.delete({
      where: { id: vocabId },
    });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error: any) {
    console.error('Error deleting vocabulary:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Vocabulary not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete vocabulary' }, { status: 500 });
  }
}
