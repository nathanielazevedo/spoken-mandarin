import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET /api/progress - Get user's progress across all lessons
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      include: {
        lesson: {
          select: {
            id: true,
            name: true,
            order: true,
            unitId: true,
            unit: {
              select: {
                id: true,
                order: true,
                levelId: true,
                level: {
                  select: {
                    id: true,
                    order: true,
                    programId: true,
                  },
                },
              },
            },
          },
        },
        examAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
