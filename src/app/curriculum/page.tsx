"use client";

import { useRouter } from "next/navigation";
import { CurriculumPage } from "../../components/CurriculumPage";

export default function Curriculum() {
  const router = useRouter();
  return (
    <CurriculumPage onLessonClick={(lessonId) => router.push(`/lesson/${lessonId}`)} />
  );
}
