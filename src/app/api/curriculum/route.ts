import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/curriculum - Get the full curriculum hierarchy
export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: {
        levels: {
          orderBy: { order: "asc" },
          include: {
            units: {
              orderBy: { order: "asc" },
              include: {
                lessons: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    order: true,
                    name: true,
                    description: true,
                    isUnitFinal: true,
                    _count: {
                      select: {
                        vocabulary: true,
                        sentences: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum" },
      { status: 500 }
    );
  }
}
