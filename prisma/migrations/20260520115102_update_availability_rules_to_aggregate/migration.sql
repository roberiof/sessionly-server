/*
  Warnings:

  - You are about to drop the `AvailabilityRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AvailabilityRule" DROP CONSTRAINT "AvailabilityRule_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "AvailabilitySlot" DROP CONSTRAINT "AvailabilitySlot_ruleId_fkey";

-- DropTable
DROP TABLE "AvailabilityRule";

-- CreateTable
CREATE TABLE "AvailabilityRules" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "days" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityRules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRules_mentorId_key" ON "AvailabilityRules"("mentorId");

-- AddForeignKey
ALTER TABLE "AvailabilityRules" ADD CONSTRAINT "AvailabilityRules_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AvailabilityRules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
