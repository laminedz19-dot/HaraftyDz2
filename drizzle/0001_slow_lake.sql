CREATE TABLE `providerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`trade` varchar(160) NOT NULL,
	`category` varchar(64) NOT NULL,
	`bio` text,
	`city` varchar(120),
	`phone` varchar(32),
	`hourlyRate` int,
	`rating` varchar(8) DEFAULT '0',
	`completedJobs` int NOT NULL DEFAULT 0,
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providerProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`providerId` int,
	`category` varchar(64) NOT NULL,
	`subcategory` varchar(120),
	`description` text,
	`address` varchar(255) NOT NULL,
	`scheduledAt` timestamp,
	`status` enum('draft','pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `accountType` enum('customer','provider') DEFAULT 'customer' NOT NULL;