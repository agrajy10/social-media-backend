/*
  Warnings:

  - The primary key for the `CommentClosure` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `childCommentId` on the `CommentClosure` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `CommentClosure` table. All the data in the column will be lost.
  - You are about to drop the column `parentCommentId` on the `CommentClosure` table. All the data in the column will be lost.
  - Added the required column `ancestorId` to the `CommentClosure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descendantId` to the `CommentClosure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommentClosure" DROP CONSTRAINT "CommentClosure_pkey",
DROP COLUMN "childCommentId",
DROP COLUMN "id",
DROP COLUMN "parentCommentId",
ADD COLUMN     "ancestorId" INTEGER NOT NULL,
ADD COLUMN     "descendantId" INTEGER NOT NULL,
ALTER COLUMN "depth" SET DEFAULT 0,
ADD CONSTRAINT "CommentClosure_pkey" PRIMARY KEY ("ancestorId", "descendantId");

-- AddForeignKey
ALTER TABLE "CommentClosure" ADD CONSTRAINT "CommentClosure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentClosure" ADD CONSTRAINT "CommentClosure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
