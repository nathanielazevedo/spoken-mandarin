import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions-server';

// POST /api/admin/curriculum/levels - Create a new level
export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {

    const body = await request.json();
    const { programId, name, description } = body;

    if (!programId || !name) {
      return NextResponse.json(
        { error: 'programId and name are required' },
        { status: 400 }
      );
    }

    // Get the next order number for this program
    const maxOrder = await prisma.level.aggregate({
      where: { programId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const level = await prisma.level.create({
      data: {
        programId,
        name,
        description: description || null,
        order: nextOrder,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ level }, { status: 201 });
  } catch (error) {
    console.error('Error creating level:', error);
    return NextResponse.json({ error: 'Failed to create level' }, { status: 500 });
  }
}
