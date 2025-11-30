import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            vocabulary: true,
            sentences: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const rawTitle = (body as { title?: unknown }).title;
    const title =
      typeof rawTitle === "string" ? rawTitle.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Lesson title is required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: { title },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            vocabulary: true,
            sentences: true,
          },
        },
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
