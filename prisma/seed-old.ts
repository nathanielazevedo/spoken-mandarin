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

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
      data: {
        levelId: levelI.id,
        ...unitData,
        updatedAt: new Date(),
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
            updatedAt: new Date(),
            vocabulary: {
              create: vocabulary,
            },
            sentences: {
              create: sentences,
            },
            exam: {
              create: {
                title: `${lessonFields.name} Exam`,
                description: `Test your knowledge of ${lessonFields.name}`,
                passingScore: 80,
                updatedAt: new Date(),
                questions: {
                  create: [
                    // Create questions from vocabulary
                    ...vocabulary.slice(0, 3).map((v, i) => ({
                      order: i + 1,
                      type: "TRANSLATE_TO_ENGLISH" as const,
                      prompt: v.pinyin,
                      correctAnswer: v.english,
                      options: [],
                      points: 1,
                      updatedAt: new Date(),
                    })),
                    // Create questions from sentences
                    ...sentences.slice(0, 2).map((s, i) => ({
                      order: vocabulary.slice(0, 3).length + i + 1,
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

        console.log(
          `  ✅ Created lesson: Lesson ${lesson.order} - ${lesson.name} (with exam)`
        );
      }

      // Create Unit Final for Unit 1
      const allUnit1Vocab = [
        { hanzi: "你好", pinyin: "nǐ hǎo", english: "hello" },
        { hanzi: "再见", pinyin: "zài jiàn", english: "goodbye" },
        { hanzi: "早上好", pinyin: "zǎo shang hǎo", english: "good morning" },
        { hanzi: "我", pinyin: "wǒ", english: "I / me" },
        { hanzi: "叫", pinyin: "jiào", english: "to be called" },
        { hanzi: "名字", pinyin: "míng zi", english: "name" },
      ];
      const allUnit1Sentences = [
        { pinyin: "Nǐ hǎo!", english: "Hello!" },
        { pinyin: "Zài jiàn!", english: "Goodbye!" },
        { pinyin: "Wǒ jiào Lǐ Míng.", english: "My name is Li Ming." },
        { pinyin: "Nǐ jiào shén me míng zi?", english: "What is your name?" },
      ];

      const unitFinal1 = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          order: 3,
          name: "Unit Final: Greetings & Introductions",
          description: "Comprehensive test covering all material from this unit",
          isUnitFinal: true,
          updatedAt: new Date(),
          exam: {
            create: {
              title: "Unit 1 Final Exam",
              description: "Demonstrate mastery of greetings and introductions",
              passingScore: 80,
              updatedAt: new Date(),
              questions: {
                create: [
                  ...allUnit1Vocab.map((v, i) => ({
                    order: i + 1,
                    type: "TRANSLATE_TO_ENGLISH" as const,
                    prompt: v.pinyin,
                    correctAnswer: v.english,
                    options: [],
                    points: 1,
                    updatedAt: new Date(),
                  })),
                  ...allUnit1Sentences.map((s, i) => ({
                    order: allUnit1Vocab.length + i + 1,
                    type: "TRANSLATE_TO_ENGLISH" as const,
                    prompt: s.pinyin,
                    correctAnswer: s.english,
                    options: [],
                    points: 2,
                    updatedAt: new Date(),
                  })),
                ],
              },
            },
          },
        },
      });
      console.log(`  🏆 Created Unit Final: ${unitFinal1.name}`);
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
            updatedAt: new Date(),
            vocabulary: {
              create: vocabulary,
            },
            sentences: {
              create: sentences,
            },
            exam: {
              create: {
                title: `${lessonFields.name} Exam`,
                description: `Test your knowledge of ${lessonFields.name}`,
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
                      order: vocabulary.slice(0, 3).length + i + 1,
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

        console.log(
          `  ✅ Created lesson: Lesson ${lesson.order} - ${lesson.name} (with exam)`
        );
      }

      // Create Unit Final for Unit 2
      const allUnit2Vocab = [
        { pinyin: "yī", english: "one" },
        { pinyin: "èr", english: "two" },
        { pinyin: "sān", english: "three" },
        { pinyin: "sì", english: "four" },
        { pinyin: "wǔ", english: "five" },
        { pinyin: "liù", english: "six" },
        { pinyin: "qī", english: "seven" },
        { pinyin: "bā", english: "eight" },
        { pinyin: "jiǔ", english: "nine" },
        { pinyin: "shí", english: "ten" },
      ];

      const unitFinal2 = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          order: 2,
          name: "Unit Final: Numbers & Counting",
          description: "Comprehensive test covering all numbers from this unit",
          isUnitFinal: true,
          updatedAt: new Date(),
          exam: {
            create: {
              title: "Unit 2 Final Exam",
              description: "Demonstrate mastery of numbers 1-10",
              passingScore: 80,
              updatedAt: new Date(),
              questions: {
                create: allUnit2Vocab.map((v, i) => ({
                  order: i + 1,
                  type: "TRANSLATE_TO_ENGLISH" as const,
                  prompt: v.pinyin,
                  correctAnswer: v.english,
                  options: [],
                  points: 1,
                  updatedAt: new Date(),
                })),
              },
            },
          },
        },
      });
      console.log(`  🏆 Created Unit Final: ${unitFinal2.name}`);
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
            updatedAt: new Date(),
            vocabulary: {
              create: vocabulary,
            },
            sentences: {
              create: sentences,
            },
            exam: {
              create: {
                title: `${lessonFields.name} Exam`,
                description: `Test your knowledge of ${lessonFields.name}`,
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
                      order: vocabulary.slice(0, 3).length + i + 1,
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

        console.log(
          `  ✅ Created lesson: Lesson ${lesson.order} - ${lesson.name} (with exam)`
        );
      }

      // Create Unit Final for Unit 3
      const allUnit3Vocab = [
        { pinyin: "xiǎng", english: "to want / to think" },
        { pinyin: "yào", english: "to want / to need" },
        { pinyin: "xū yào", english: "to need" },
        { pinyin: "xǐ huan", english: "to like" },
        { pinyin: "yǒu", english: "to have" },
        { pinyin: "méi yǒu", english: "to not have" },
        { pinyin: "zài", english: "at / in / to be at" },
        { pinyin: "qù", english: "to go" },
        { pinyin: "lái", english: "to come" },
      ];
      const allUnit3Sentences = [
        { pinyin: "Wǒ xiǎng hē shuǐ.", english: "I want to drink water." },
        { pinyin: "Nǐ yào shén me?", english: "What do you want?" },
        { pinyin: "Wǒ yǒu yī běn shū.", english: "I have a book." },
        { pinyin: "Tā zài jiā.", english: "He is at home." },
      ];

      const unitFinal3 = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          order: 3,
          name: "Unit Final: Core Verbs",
          description: "Comprehensive test covering all verbs from this unit",
          isUnitFinal: true,
          updatedAt: new Date(),
          exam: {
            create: {
              title: "Unit 3 Final Exam",
              description: "Demonstrate mastery of core verbs",
              passingScore: 80,
              updatedAt: new Date(),
              questions: {
                create: [
                  ...allUnit3Vocab.map((v, i) => ({
                    order: i + 1,
                    type: "TRANSLATE_TO_ENGLISH" as const,
                    prompt: v.pinyin,
                    correctAnswer: v.english,
                    options: [],
                    points: 1,
                    updatedAt: new Date(),
                  })),
                  ...allUnit3Sentences.map((s, i) => ({
                    order: allUnit3Vocab.length + i + 1,
                    type: "TRANSLATE_TO_ENGLISH" as const,
                    prompt: s.pinyin,
                    correctAnswer: s.english,
                    options: [],
                    points: 2,
                    updatedAt: new Date(),
                  })),
                ],
              },
            },
          },
        },
      });
      console.log(`  🏆 Created Unit Final: ${unitFinal3.name}`);
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
