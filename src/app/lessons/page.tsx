"use client";

import { useRouter } from "next/navigation";
import { HomePage } from "../../components/HomePage";
import { Layout } from "../../components/Layout";

export default function LessonsPage() {
  const router = useRouter();
  return (
    <Layout>
      <HomePage
        onLessonClick={(lessonId) => router.push(`/lesson/${lessonId}`)}
      />
    </Layout>
  );
}
