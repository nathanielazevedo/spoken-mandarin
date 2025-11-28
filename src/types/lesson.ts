export interface Vocabulary {
  id: string;
  pinyin: string;
  english: string;
}

export interface ConversationUtterance {
  pinyin: string;
  english: string;
  hint?: string;
}

export interface ConversationValidation {
  exact?: string;
  startsWith?: string;
  endsWith?: string;
  mustInclude?: string[];
}

export interface ConversationTurn {
  id: string;
  bot: ConversationUtterance;
  user: ConversationUtterance;
  validation?: ConversationValidation;
}

export interface Conversation {
  title: string;
  turns: ConversationTurn[];
}

export interface Lesson {
  id: string;
  title: string;
  vocabulary: Vocabulary[];
  conversation: Conversation;
}