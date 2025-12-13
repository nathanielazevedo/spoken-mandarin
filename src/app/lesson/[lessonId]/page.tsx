"use client";

import { useRouter, useParams } from "next/navigation";
import { LessonPage } from "../../../components/LessonPage";

export default function Lesson() {
  const router = useRouter();
  const params = useParams<{ lessonId?: string | string[] }>();
  const rawId = params?.lessonId;
  const lessonId = Array.isArray(rawId) ? rawId[0] : rawId ?? null;

  return (
    <LessonPage lessonId={lessonId} onBack={() => router.push("/lessons")} />
  );
}
