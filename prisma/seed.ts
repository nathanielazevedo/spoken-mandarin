import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.sentence.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.level.deleteMany();
  await prisma.program.deleteMany();

  // Create the main program
  const program = await prisma.program.create({
    data: {
      name: "Spoken Mandarin",
      description:
        "Master conversational Mandarin Chinese through a structured, mastery-based approach",
    },
  });

  console.log(`✅ Created program: ${program.name}`);

  // Create Level I: Foundations
  const levelI = await prisma.level.create({
    data: {
      programId: program.id,
      order: 1,
      name: "Foundations",
      description: "Essential building blocks for Mandarin communication",
    },
  });

  console.log(`✅ Created level: Level I - ${levelI.name}`);

  // Create Units for Level I
  const unitsData = [
    {
      order: 1,
      name: "Greetings & Introductions",
      description: "Learn to greet people and introduce yourself",
    },
    {
      order: 2,
      name: "Numbers & Counting",
      description: "Master numbers and basic counting",
    },
    {
      order: 3,
      name: "Core Verbs",
      description: "Essential verbs for everyday communication",
    },
  ];

  for (const unitData of unitsData) {
    const unit = await prisma.unit.create({
      data: {
        levelId: levelI.id,
        ...unitData,
      },
    });

    console.log(`✅ Created unit: Unit ${unit.order} - ${unit.name}`);

    // Create sample lessons for Unit 1 (Greetings)
    if (unitData.order === 1) {
      const lessonsData = [
        {
          order: 1,
          name: "Hello & Goodbye",
          description: "Basic greetings and farewells",
          vocabulary: [
            { order: 1, hanzi: "你好", pinyin: "nǐ hǎo", english: "hello" },
            { order: 2, hanzi: "再见", pinyin: "zài jiàn", english: "goodbye" },
            {
              order: 3,
              hanzi: "早上好",
              pinyin: "zǎo shang hǎo",
              english: "good morning",
            },
            {
              order: 4,
              hanzi: "晚上好",
              pinyin: "wǎn shang hǎo",
              english: "good evening",
            },
            { order: 5, hanzi: "谢谢", pinyin: "xiè xie", english: "thank you" },
          ],
          sentences: [
            { order: 1, hanzi: "你好！", pinyin: "Nǐ hǎo!", english: "Hello!" },
            {
              order: 2,
              hanzi: "早上好！",
              pinyin: "Zǎo shang hǎo!",
              english: "Good morning!",
            },
            {
              order: 3,
              hanzi: "再见！",
              pinyin: "Zài jiàn!",
              english: "Goodbye!",
            },
            {
              order: 4,
              hanzi: "谢谢你。",
              pinyin: "Xiè xie nǐ.",
              english: "Thank you.",
            },
          ],
        },
        {
          order: 2,
          name: "Introducing Yourself",
          description: "Share your name and basic information",
          vocabulary: [
            { order: 1, hanzi: "我", pinyin: "wǒ", english: "I / me" },
            { order: 2, hanzi: "你", pinyin: "nǐ", english: "you" },
            { order: 3, hanzi: "叫", pinyin: "jiào", english: "to be called" },
            { order: 4, hanzi: "是", pinyin: "shì", english: "to be" },
            { order: 5, hanzi: "什么", pinyin: "shén me", english: "what" },
            { order: 6, hanzi: "名字", pinyin: "míng zi", english: "name" },
          ],
          sentences: [
            {
              order: 1,
              hanzi: "我叫李明。",
              pinyin: "Wǒ jiào Lǐ Míng.",
              english: "My name is Li Ming.",
            },
            {
              order: 2,
              hanzi: "你叫什么名字？",
              pinyin: "Nǐ jiào shén me míng zi?",
              english: "What is your name?",
            },
            {
              order: 3,
              hanzi: "很高兴认识你。",
              pinyin: "Hěn gāo xìng rèn shi nǐ.",
              english: "Nice to meet you.",
            },
          ],
        },
      ];

      for (const lessonData of lessonsData) {
        const { vocabulary, sentences, ...lessonFields } = lessonData;

        const lesson = await prisma.lesson.create({
          data: {
            unitId: unit.id,
            ...lessonFields,
            vocabulary: {
              create: vocabulary,
            },
            sentences: {
              create: sentences,
            },
          },
        });

        console.log(
          `  ✅ Created lesson: Lesson ${lesson.order} - ${lesson.name}`
        );
      }
    }

    // Create sample lessons for Unit 2 (Numbers)
    if (unitData.order === 2) {
      const lessonsData = [
        {
          order: 1,
          name: "Numbers 1-10",
          description: "Learn to count from one to ten",
          vocabulary: [
            { order: 1, hanzi: "一", pinyin: "yī", english: "one" },
            { order: 2, hanzi: "二", pinyin: "èr", english: "two" },
            { order: 3, hanzi: "三", pinyin: "sān", english: "three" },
            { order: 4, hanzi: "四", pinyin: "sì", english: "four" },
            { order: 5, hanzi: "五", pinyin: "wǔ", english: "five" },
            { order: 6, hanzi: "六", pinyin: "liù", english: "six" },
            { order: 7, hanzi: "七", pinyin: "qī", english: "seven" },
            { order: 8, hanzi: "八", pinyin: "bā", english: "eight" },
            { order: 9, hanzi: "九", pinyin: "jiǔ", english: "nine" },
            { order: 10, hanzi: "十", pinyin: "shí", english: "ten" },
          ],
          sentences: [
            {
              order: 1,
              hanzi: "我有三个苹果。",
              pinyin: "Wǒ yǒu sān gè píng guǒ.",
              english: "I have three apples.",
            },
            {
              order: 2,
              hanzi: "五加五等于十。",
              pinyin: "Wǔ jiā wǔ děng yú shí.",
              english: "Five plus five equals ten.",
            },
          ],
        },
      ];

      for (const lessonData of lessonsData) {
        const { vocabulary, sentences, ...lessonFields } = lessonData;

        const lesson = await prisma.lesson.create({
          data: {
            unitId: unit.id,
            ...lessonFields,
            vocabulary: {
              create: vocabulary,
            },
            sentences: {
              create: sentences,
            },
          },
        });

        console.log(
          `  ✅ Created lesson: Lesson ${lesson.order} - ${lesson.name}`
        );
      }
    }

    // Create sample lessons for Unit 3 (Core Verbs)
    if (unitData.order === 3) {
      const lessonsData = [
        {
          order: 1,
          name: "Want & Need",
          description: "Express desires and necessities",
          vocabulary: [
            { order: 1, hanzi: "想", pinyin: "xiǎng", english: "to want / to think" },
            { order: 2, hanzi: "要", pinyin: "yào", english: "to want / to need" },
            { order: 3, hanzi: "需要", pinyin: "xū yào", english: "to need" },
            { order: 4, hanzi: "喜欢", pinyin: "xǐ huan", english: "to like" },
          ],
          sentences: [
            {
              order: 1,
              hanzi: "我想喝水。",
              pinyin: "Wǒ xiǎng hē shuǐ.",
              english: "I want to drink water.",
            },
            {
              order: 2,
              hanzi: "你要什么？",
              pinyin: "Nǐ yào shén me?",
              english: "What do you want?",
            },
            {
              order: 3,
              hanzi: "我喜欢学中文。",
              pinyin: "Wǒ xǐ huan xué zhōng wén.",
              english: "I like learning Chinese.",
            },
          ],
        },
        {
          order: 2,
          name: "Simple Statements",
          description: "Make basic declarative sentences",
          vocabulary: [
            { order: 1, hanzi: "有", pinyin: "yǒu", english: "to have" },
            { order: 2, hanzi: "没有", pinyin: "méi yǒu", english: "to not have" },
            { order: 3, hanzi: "在", pinyin: "zài", english: "at / in / to be at" },
            { order: 4, hanzi: "去", pinyin: "qù", english: "to go" },
            { order: 5, hanzi: "来", pinyin: "lái", english: "to come" },
          ],
          sentences: [
            {
              order: 1,
              hanzi: "我有一本书。",
              pinyin: "Wǒ yǒu yī běn shū.",
              english: "I have a book.",
            },
            {
              order: 2,
              hanzi: "他在家。",
              pinyin: "Tā zài jiā.",
              english: "He is at home.",
            },
            {
              order: 3,
              hanzi: "我们去学校。",
              pinyin: "Wǒ men qù xué xiào.",
              english: "We go to school.",
            },
          ],
        },
      ];

      for (const lessonData of lessonsData) {
        const { vocabulary, sentences, ...lessonFields } = lessonData;

        const lesson = await prisma.lesson.create({
          data: {
            unitId: unit.id,
            ...lessonFields,
            vocabulary: {
              create: vocabulary,
            },
            sentences: {
              create: sentences,
            },
          },
        });

        console.log(
          `  ✅ Created lesson: Lesson ${lesson.order} - ${lesson.name}`
        );
      }
    }
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
