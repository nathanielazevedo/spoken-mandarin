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

// Helper function to generate sample vocabulary for a lesson
function generateVocabulary(lessonNumber: number, count: number = 5) {
  const samples = [
    { hanzi: "你好", pinyin: "nǐ hǎo", english: "hello" },
    { hanzi: "再见", pinyin: "zài jiàn", english: "goodbye" },
    { hanzi: "谢谢", pinyin: "xiè xie", english: "thank you" },
    { hanzi: "是", pinyin: "shì", english: "to be" },
    { hanzi: "有", pinyin: "yǒu", english: "to have" },
    { hanzi: "去", pinyin: "qù", english: "to go" },
    { hanzi: "来", pinyin: "lái", english: "to come" },
    { hanzi: "吃", pinyin: "chī", english: "to eat" },
    { hanzi: "喝", pinyin: "hē", english: "to drink" },
    { hanzi: "看", pinyin: "kàn", english: "to look/watch" },
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    order: i + 1,
    hanzi: samples[(lessonNumber * count + i) % samples.length].hanzi,
    pinyin: samples[(lessonNumber * count + i) % samples.length].pinyin,
    english: samples[(lessonNumber * count + i) % samples.length].english,
  }));
}

// Helper function to generate sample sentences for a lesson
function generateSentences(lessonNumber: number, count: number = 3) {
  const samples = [
    { hanzi: "你好！", pinyin: "Nǐ hǎo!", english: "Hello!" },
    { hanzi: "再见！", pinyin: "Zài jiàn!", english: "Goodbye!" },
    { hanzi: "谢谢你。", pinyin: "Xiè xie nǐ.", english: "Thank you." },
    { hanzi: "我很好。", pinyin: "Wǒ hěn hǎo.", english: "I am well." },
    { hanzi: "你呢？", pinyin: "Nǐ ne?", english: "And you?" },
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    order: i + 1,
    hanzi: samples[(lessonNumber * count + i) % samples.length].hanzi,
    pinyin: samples[(lessonNumber * count + i) % samples.length].pinyin,
    english: samples[(lessonNumber * count + i) % samples.length].english,
  }));
}

// Helper to convert numbers to Roman numerals
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let result = "";
  let remaining = num;

  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (order matters due to foreign keys)
  await prisma.examAttempt.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.exam.deleteMany();
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
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Created program: ${program.name}`);

  // Define 5 levels with their units
  const levelsData = [
    {
      order: 1,
      name: "Foundations",
      description: "Essential building blocks for Mandarin communication",
      units: [
        { name: "Greetings & Introductions", description: "Learn to greet people and introduce yourself" },
        { name: "Numbers & Counting", description: "Master numbers and basic counting" },
        { name: "Core Verbs", description: "Essential verbs for everyday communication" },
        { name: "Family & Relationships", description: "Talk about family members and relationships" },
        { name: "Daily Routines", description: "Describe your daily activities and schedule" },
      ]
    },
    {
      order: 2,
      name: "Daily Life",
      description: "Navigate everyday situations and conversations",
      units: [
        { name: "Food & Dining", description: "Order food and discuss meals" },
        { name: "Shopping & Money", description: "Shop and handle transactions" },
        { name: "Transportation", description: "Get around using various transportation" },
        { name: "Directions & Locations", description: "Ask for and give directions" },
        { name: "Time & Dates", description: "Express time, dates, and schedules" },
      ]
    },
    {
      order: 3,
      name: "Social Interactions",
      description: "Engage in meaningful social conversations",
      units: [
        { name: "Hobbies & Interests", description: "Discuss activities you enjoy" },
        { name: "Making Plans", description: "Arrange meetings and activities" },
        { name: "Weather & Seasons", description: "Talk about weather and seasonal changes" },
        { name: "Health & Wellness", description: "Discuss health and medical topics" },
        { name: "Emotions & Feelings", description: "Express how you feel" },
      ]
    },
    {
      order: 4,
      name: "Work & Education",
      description: "Communicate in professional and educational settings",
      units: [
        { name: "Jobs & Careers", description: "Discuss work and professions" },
        { name: "School & Learning", description: "Talk about education and studying" },
        { name: "Technology & Communication", description: "Use tech-related vocabulary" },
        { name: "Office & Business", description: "Handle workplace situations" },
        { name: "Goals & Achievements", description: "Discuss aspirations and accomplishments" },
      ]
    },
    {
      order: 5,
      name: "Culture & Society",
      description: "Explore Chinese culture and contemporary topics",
      units: [
        { name: "Holidays & Celebrations", description: "Understand Chinese festivals and traditions" },
        { name: "Arts & Entertainment", description: "Discuss movies, music, and culture" },
        { name: "Travel & Tourism", description: "Plan trips and explore destinations" },
        { name: "News & Current Events", description: "Discuss contemporary topics" },
        { name: "Advanced Conversations", description: "Engage in complex discussions" },
      ]
    }
  ];

  // Create all levels, units, and lessons
  for (const levelData of levelsData) {
    const level = await prisma.level.create({
      data: {
        programId: program.id,
        order: levelData.order,
        name: levelData.name,
        description: levelData.description,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Created level: Level ${toRoman(levelData.order)} - ${level.name}`);

    // Create units for this level
    for (let unitIndex = 0; unitIndex < levelData.units.length; unitIndex++) {
      const unitData = levelData.units[unitIndex];
      const unit = await prisma.unit.create({
        data: {
          levelId: level.id,
          order: unitIndex + 1,
          name: unitData.name,
          description: unitData.description,
          updatedAt: new Date(),
        },
      });

      console.log(`  ✅ Created unit: Unit ${unitIndex + 1} - ${unit.name}`);

      // Track all vocabulary and sentences for unit final
      const allUnitVocab: any[] = [];
      const allUnitSentences: any[] = [];

      // Create 5 lessons for this unit
      for (let lessonOrder = 1; lessonOrder <= 5; lessonOrder++) {
        const vocabulary = generateVocabulary(levelData.order * 100 + unitIndex * 10 + lessonOrder, 5);
        const sentences = generateSentences(levelData.order * 100 + unitIndex * 10 + lessonOrder, 3);

        // Store for unit final
        allUnitVocab.push(...vocabulary);
        allUnitSentences.push(...sentences);

        const lesson = await prisma.lesson.create({
          data: {
            unitId: unit.id,
            order: lessonOrder,
            name: `Lesson ${lessonOrder}`,
            description: `Practice session ${lessonOrder} for ${unitData.name}`,
            updatedAt: new Date(),
            vocabulary: {
              create: vocabulary,
            },
            sentences: {
              create: sentences,
            },
            exam: {
              create: {
                title: `Lesson ${lessonOrder} Exam`,
                description: `Test your knowledge from lesson ${lessonOrder}`,
                passingScore: 80,
                updatedAt: new Date(),
                questions: {
                  create: [
                    ...vocabulary.slice(0, 3).map((v, i) => ({
                      order: i + 1,
                      type: "TRANSLATE_TO_ENGLISH" as const,
                      prompt: v.pinyin,
                      correctAnswer: v.english,
                      options: [],
                      points: 1,
                      updatedAt: new Date(),
                    })),
                    ...sentences.slice(0, 2).map((s, i) => ({
                      order: 4 + i,
                      type: "TRANSLATE_TO_ENGLISH" as const,
                      prompt: s.pinyin,
                      correctAnswer: s.english,
                      options: [],
                      points: 1,
                      updatedAt: new Date(),
                    })),
                  ],
                },
              },
            },
          },
        });

        console.log(`    📝 Created lesson: Lesson ${lessonOrder}`);
      }

      // Create Unit Final (6th lesson)
      const unitFinalQuestions = [
        ...allUnitVocab.slice(0, 10).map((v, i) => ({
          order: i + 1,
          type: "TRANSLATE_TO_ENGLISH" as const,
          prompt: v.pinyin,
          correctAnswer: v.english,
          options: [],
          points: 1,
          updatedAt: new Date(),
        })),
        ...allUnitSentences.slice(0, 5).map((s, i) => ({
          order: 11 + i,
          type: "TRANSLATE_TO_ENGLISH" as const,
          prompt: s.pinyin,
          correctAnswer: s.english,
          options: [],
          points: 2,
          updatedAt: new Date(),
        })),
      ];

      const unitFinal = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          order: 6,
          name: `Unit Final: ${unitData.name}`,
          description: `Comprehensive test covering all material from ${unitData.name}`,
          isUnitFinal: true,
          updatedAt: new Date(),
          exam: {
            create: {
              title: `Unit ${unitIndex + 1} Final Exam`,
              description: `Demonstrate mastery of ${unitData.name}`,
              passingScore: 80,
              updatedAt: new Date(),
              questions: {
                create: unitFinalQuestions,
              },
            },
          },
        },
      });

      console.log(`    🏆 Created Unit Final: ${unitFinal.name}`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log(`📊 Created: 5 levels, 25 units, 150 lessons (125 regular + 25 unit finals)`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
