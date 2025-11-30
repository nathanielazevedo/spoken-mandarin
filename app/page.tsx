"use client";

import { useRouter } from "next/navigation";
import { HomePage } from "../src/components/HomePage";

export default function Home() {
  const router = useRouter();
  return (
    <HomePage
      onLessonClick={(lessonId) => router.push(`/lesson/${lessonId}`)}
    />
  );
}
