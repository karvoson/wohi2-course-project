/*
  Warnings:

  - You are about to drop the `_KeywordToQuestions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_KeywordToQuestions` DROP FOREIGN KEY `_KeywordToQuestions_A_fkey`;

-- DropForeignKey
ALTER TABLE `_KeywordToQuestions` DROP FOREIGN KEY `_KeywordToQuestions_B_fkey`;

-- AlterTable
ALTER TABLE `questions` ADD COLUMN `imageUrl` VARCHAR(255) NULL;

-- DropTable
DROP TABLE `_KeywordToQuestions`;

-- CreateTable
CREATE TABLE `likes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,

    UNIQUE INDEX `likes_userId_questionId_key`(`userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_KeywordToQuestion` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_KeywordToQuestion_AB_unique`(`A`, `B`),
    INDEX `_KeywordToQuestion_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_KeywordToQuestion` ADD CONSTRAINT `_KeywordToQuestion_A_fkey` FOREIGN KEY (`A`) REFERENCES `keywords`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_KeywordToQuestion` ADD CONSTRAINT `_KeywordToQuestion_B_fkey` FOREIGN KEY (`B`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
