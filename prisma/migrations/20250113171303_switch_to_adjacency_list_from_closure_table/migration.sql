/*
  Warnings:

  - You are about to drop the `CommentClosure` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CommentClosure" DROP CONSTRAINT "CommentClosure_ancestorId_fkey";

-- DropForeignKey
ALTER TABLE "CommentClosure" DROP CONSTRAINT "CommentClosure_descendantId_fkey";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parentId" INTEGER;

-- DropTable
DROP TABLE "CommentClosure";

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
