import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions-server';

// POST /api/admin/curriculum/lessons - Create a new lesson
export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {

    const body = await request.json();
    const { unitId, name, description } = body;

    if (!unitId || !name) {
      return NextResponse.json(
        { error: 'unitId and name are required' },
        { status: 400 }
      );
    }

    // Get the next order number for this unit
    const maxOrder = await prisma.lesson.aggregate({
      where: { unitId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        unitId,
        name,
        description: description || null,
        order: nextOrder,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
