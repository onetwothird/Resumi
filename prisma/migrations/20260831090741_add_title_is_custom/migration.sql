/*
  Warnings:

  - You are about to drop the column `fullName` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "fullName",
ADD COLUMN     "blockStyles" JSONB,
ADD COLUMN     "certifications" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "theme" JSONB,
ADD COLUMN     "titleIsCustom" BOOLEAN NOT NULL DEFAULT false;
