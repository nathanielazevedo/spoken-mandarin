import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET /api/progress/unlocked - Get unlocked status for all content
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user's completed lessons (where exam is passed)
    const completedProgress = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
        examPassed: true,
      },
      select: {
        lessonId: true,
        lesson: {
          select: {
            id: true,
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
      },
    });

    // Get full curriculum structure
    const programs = await prisma.program.findMany({
      include: {
        levels: {
          orderBy: { order: 'asc' },
          include: {
            units: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    order: true,
                    exam: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Build sets of completed items
    const completedLessons = new Set(completedProgress.map(p => p.lessonId));
    
    // Calculate unlocked status
    const unlockedLessons = new Set<string>();
    const unlockedUnits = new Set<string>();
    const unlockedLevels = new Set<string>();

    for (const program of programs) {
      for (let levelIndex = 0; levelIndex < program.levels.length; levelIndex++) {
        const level = program.levels[levelIndex];
        const previousLevel = levelIndex > 0 ? program.levels[levelIndex - 1] : null;

        // Level is unlocked if:
        // 1. It's the first level, OR
        // 2. All lessons in the previous level are completed
        const levelUnlocked = !previousLevel || 
          previousLevel.units.every(unit => 
            unit.lessons.every(lesson => 
              !lesson.exam || completedLessons.has(lesson.id) // No exam = auto-complete, or exam passed
            )
          );

        if (levelUnlocked) {
          unlockedLevels.add(level.id);

          for (let unitIndex = 0; unitIndex < level.units.length; unitIndex++) {
            const unit = level.units[unitIndex];
            const previousUnit = unitIndex > 0 ? level.units[unitIndex - 1] : null;

            // Unit is unlocked if:
            // 1. Level is unlocked AND
            // 2. It's the first unit in the level, OR all lessons in previous unit are completed
            const unitUnlocked = !previousUnit ||
              previousUnit.lessons.every(lesson => 
                !lesson.exam || completedLessons.has(lesson.id)
              );

            if (unitUnlocked) {
              unlockedUnits.add(unit.id);

              for (let lessonIndex = 0; lessonIndex < unit.lessons.length; lessonIndex++) {
                const lesson = unit.lessons[lessonIndex];
                const previousLesson = lessonIndex > 0 ? unit.lessons[lessonIndex - 1] : null;

                // Lesson is unlocked if:
                // 1. Unit is unlocked AND
                // 2. It's the first lesson, OR previous lesson is completed
                const lessonUnlocked = !previousLesson ||
                  !previousLesson.exam || completedLessons.has(previousLesson.id);

                if (lessonUnlocked) {
                  unlockedLessons.add(lesson.id);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      completedLessons: Array.from(completedLessons),
      unlockedLessons: Array.from(unlockedLessons),
      unlockedUnits: Array.from(unlockedUnits),
      unlockedLevels: Array.from(unlockedLevels),
    });
  } catch (error) {
    console.error('Error fetching unlocked status:', error);
    return NextResponse.json({ error: 'Failed to fetch unlocked status' }, { status: 500 });
  }
}
