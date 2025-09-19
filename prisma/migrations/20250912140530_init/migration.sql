-- AlterTable
ALTER TABLE `menuitem` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `itemNumber` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `orderitem` MODIFY `status` ENUM('pending', 'preparing', 'ready', 'completed') NOT NULL;
