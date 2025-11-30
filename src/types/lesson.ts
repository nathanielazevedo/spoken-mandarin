export interface PracticeEntry {
  id: string;
  pinyin: string;
  english: string;
  hanzi?: string;
  audioUrl?: string;
}

export type Vocabulary = PracticeEntry;

export type Sentence = PracticeEntry;

export interface Lesson {
  id: string;
  title: string;
  vocabulary: Vocabulary[];
  sentences: Sentence[];
}