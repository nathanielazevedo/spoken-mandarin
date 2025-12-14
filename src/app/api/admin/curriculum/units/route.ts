import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions-server';

// POST /api/admin/curriculum/units - Create a new unit
export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {

    const body = await request.json();
    const { levelId, name, description } = body;

    if (!levelId || !name) {
      return NextResponse.json(
        { error: 'levelId and name are required' },
        { status: 400 }
      );
    }

    // Get the next order number for this level
    const maxOrder = await prisma.unit.aggregate({
      where: { levelId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const unit = await prisma.unit.create({
      data: {
        levelId,
        name,
        description: description || null,
        order: nextOrder,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
  }
}
