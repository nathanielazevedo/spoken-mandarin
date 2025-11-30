/*
  Warnings:

  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversationTurn` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationTurn" DROP CONSTRAINT "ConversationTurn_conversationId_fkey";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "ConversationTurn";

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "audioUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sentence_lessonId_idx" ON "Sentence"("lessonId");

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
