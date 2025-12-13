import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        order: true,
        name: true,
        description: true,
        unit: {
          select: {
            id: true,
            order: true,
            name: true,
            level: {
              select: {
                id: true,
                order: true,
                name: true,
                program: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            vocabulary: true,
            sentences: true,
          },
        },
      },
      orderBy: [
        { unit: { level: { order: "asc" } } },
        { unit: { order: "asc" } },
        { order: "asc" },
      ],
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
