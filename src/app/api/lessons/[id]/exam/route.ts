import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions-server';

// GET /api/lessons/[id]/exam - Get exam for a lesson
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await context.params;

    const exam = await prisma.exam.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        lesson: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      exam,
      lessonName: exam.lesson.name,
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
  }
}

// POST /api/lessons/[id]/exam - Create exam for a lesson (admin only)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: lessonId } = await context.params;
    const body = await request.json();
    const { title, description, passingScore } = body;

    // Check if exam already exists
    const existing = await prisma.exam.findUnique({
      where: { lessonId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Exam already exists for this lesson' }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        lessonId,
        title: title || null,
        description: description || null,
        passingScore: passingScore || 80,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}

// PUT /api/lessons/[id]/exam - Update exam settings (admin only)
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {

    const { id: lessonId } = await context.params;
    const body = await request.json();
    const { title, description, passingScore, timeLimit } = body;

    const exam = await prisma.exam.update({
      where: { lessonId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        passingScore: passingScore !== undefined ? passingScore : undefined,
        timeLimit: timeLimit !== undefined ? timeLimit : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ exam });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 });
  }
}

// DELETE /api/lessons/[id]/exam - Delete exam for a lesson (admin only)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {

    const { id: lessonId } = await context.params;

    await prisma.exam.delete({
      where: { lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
  }
}
