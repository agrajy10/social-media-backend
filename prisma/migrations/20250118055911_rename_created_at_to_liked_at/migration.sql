/*
  Warnings:

  - You are about to drop the column `createdAt` on the `PostLike` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PostLike" DROP COLUMN "createdAt",
ADD COLUMN     "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
