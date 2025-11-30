import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const sentenceId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!sentenceId) {
      return NextResponse.json(
        { error: 'Sentence id is required' },
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

    const data: { pinyin?: string; english?: string; hanzi?: string | null } = {};

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

    const updated = await prisma.sentence.update({
      where: { id: sentenceId },
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
    console.error('Error updating sentence:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update sentence' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const sentenceId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!sentenceId) {
      return NextResponse.json(
        { error: 'Sentence id is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.sentence.delete({
      where: { id: sentenceId },
    });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error: any) {
    console.error('Error deleting sentence:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Sentence not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete sentence' }, { status: 500 });
  }
}
