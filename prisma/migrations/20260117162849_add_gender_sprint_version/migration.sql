-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SprintPreference" AS ENUM ('FULL', 'LIGHT', 'CUSTOM');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "selectedGoals" JSONB,
ADD COLUMN     "sprintPreference" "SprintPreference";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discoveryViewedAt" TIMESTAMP(3),
ADD COLUMN     "partnerAGender" "Gender",
ADD COLUMN     "partnerBGender" "Gender";
