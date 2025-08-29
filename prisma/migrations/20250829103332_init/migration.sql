-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- AlterTable
ALTER TABLE `user` MODIFY `email` VARCHAR(191) NOT NULL DEFAULT 'a',
    MODIFY `firstName` VARCHAR(191) NOT NULL DEFAULT 'a',
    MODIFY `lastName` VARCHAR(191) NOT NULL DEFAULT 'a';
