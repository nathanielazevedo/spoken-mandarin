import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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
