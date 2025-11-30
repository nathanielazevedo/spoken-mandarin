import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
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
