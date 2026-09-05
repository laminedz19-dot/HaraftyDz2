CREATE TABLE `providerReports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `providerId` int NOT NULL,
  `reason` varchar(64) NOT NULL,
  `details` text,
  `status` enum('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `providerReports_id` PRIMARY KEY(`id`)
);
