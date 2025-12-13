export interface PracticeEntry {
  id: string;
  pinyin: string;
  english: string;
  hanzi?: string;
  audioUrl?: string;
}

export type Vocabulary = PracticeEntry;

export type Sentence = PracticeEntry;

// Hierarchy types
export interface ProgramInfo {
  id: string;
  name: string;
}

export interface LevelInfo {
  id: string;
  order: number;
  name: string;
}

export interface UnitInfo {
  id: string;
  order: number;
  name: string;
}

export interface Lesson {
  id: string;
  order: number;
  name: string;
  description?: string;
  // Hierarchy info
  unit?: UnitInfo;
  level?: LevelInfo;
  program?: ProgramInfo;
  // Content
  vocabulary: Vocabulary[];
  sentences: Sentence[];
}

// For backwards compatibility - title maps to name
export type LessonWithTitle = Lesson & { title?: string };