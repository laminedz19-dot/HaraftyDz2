ALTER TABLE `users` ADD COLUMN `phone` varchar(32) NULL, ADD COLUMN `passwordHash` varchar(255) NULL;
ALTER TABLE `users` ADD UNIQUE INDEX `users_phone_unique` (`phone`);
ALTER TABLE `providerProfiles` ADD COLUMN `published` boolean NOT NULL DEFAULT false;
UPDATE `providerProfiles` SET `published` = true;
