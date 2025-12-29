/*
  Warnings:

  - You are about to drop the column `isLevelFinal` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `isUnitFinal` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `examHighScore` on the `UserProgress` table. All the data in the column will be lost.
  - You are about to drop the column `examPassed` on the `UserProgress` table. All the data in the column will be lost.
  - You are about to drop the `Exam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExamAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExamQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "ExamAttempt" DROP CONSTRAINT "ExamAttempt_userProgressId_fkey";

-- DropForeignKey
ALTER TABLE "ExamQuestion" DROP CONSTRAINT "ExamQuestion_examId_fkey";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "isLevelFinal",
DROP COLUMN "isUnitFinal";

-- AlterTable
ALTER TABLE "UserProgress" DROP COLUMN "examHighScore",
DROP COLUMN "examPassed";

-- DropTable
DROP TABLE "Exam";

-- DropTable
DROP TABLE "ExamAttempt";

-- DropTable
DROP TABLE "ExamQuestion";

-- DropEnum
DROP TYPE "QuestionType";
