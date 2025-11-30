import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import lesson01Data from '../src/data/lessons/lesson-01-introductions.json';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.sentence.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.lesson.deleteMany();

  type SentenceSeed = {
    id?: string;
    pinyin: string;
    english: string;
    audioUrl?: string | null;
  };

  const lessonData = lesson01Data as typeof lesson01Data & {
    sentences?: SentenceSeed[];
  };

  const deriveSentences = () => {
    if (Array.isArray(lessonData.sentences) && lessonData.sentences.length > 0) {
      return lessonData.sentences.map((sentence, index) => ({
        id: sentence.id ?? `s${index + 1}`,
        pinyin: sentence.pinyin,
        english: sentence.english,
        audioUrl: sentence.audioUrl ?? null,
      }));
    }

    if (lessonData.conversation?.turns) {
      return lesson01Data.conversation.turns.flatMap((turn, turnIndex) => {
        const entries = [] as {
          id: string;
          pinyin: string;
          english: string;
          audioUrl: string | null;
        }[];

        if (turn.bot?.pinyin && turn.bot?.english) {
          entries.push({
            id: `${turn.id ?? `turn${turnIndex + 1}`}-bot`,
            pinyin: turn.bot.pinyin,
            english: turn.bot.english,
            audioUrl: null,
          });
        }

        if (turn.user?.pinyin && turn.user?.english) {
          entries.push({
            id: `${turn.id ?? `turn${turnIndex + 1}`}-user`,
            pinyin: turn.user.pinyin,
            english: turn.user.english,
            audioUrl: null,
          });
        }

        return entries;
      });
    }

    return [];
  };

  const sentences = deriveSentences();

  // Seed Lesson 01
  const lesson = await prisma.lesson.create({
    data: {
      id: lesson01Data.id,
      title: lesson01Data.title,
      vocabulary: {
        create: lesson01Data.vocabulary.map((vocab, index) => ({
          id: vocab.id,
          pinyin: vocab.pinyin,
          english: vocab.english,
          audioUrl: vocab.audioUrl || null,
          order: index,
        })),
      },
      sentences: {
        create: sentences.map((sentence, index) => ({
          id: sentence.id,
          pinyin: sentence.pinyin,
          english: sentence.english,
          audioUrl: sentence.audioUrl,
          order: index,
        })),
      },
    },
  });

  console.log(`Created lesson: ${lesson.title}`);
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
