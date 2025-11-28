import type { Lesson } from '../types/lesson';
import lesson01Data from './lessons/lesson-01-introductions.json';
import lesson02Data from './lessons/lesson-02-travel.json';
import lesson03Data from './lessons/lesson-03-family.json';
import lesson04Data from './lessons/lesson-04-numbers.json';
import lesson05Data from './lessons/lesson-05-dining.json';

export const lessons: Lesson[] = [
  lesson01Data as Lesson,
  lesson02Data as Lesson,
  lesson03Data as Lesson,
  lesson04Data as Lesson,
  lesson05Data as Lesson,
];

export const getLessonById = (id: string): Lesson | undefined => {
  return lessons.find((lesson) => lesson.id === id);
};