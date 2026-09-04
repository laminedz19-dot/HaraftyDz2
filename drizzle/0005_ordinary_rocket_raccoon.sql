CREATE TABLE `subscriptionPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('monthly','seasonal','yearly') NOT NULL,
	`amount` int NOT NULL,
	`destinationAccount` varchar(64) NOT NULL,
	`paymentKey` varchar(16) NOT NULL,
	`receiptUrl` varchar(500) NOT NULL,
	`aiVerdict` enum('likely_valid','needs_review','likely_forged') NOT NULL DEFAULT 'needs_review',
	`aiConfidence` int NOT NULL DEFAULT 0,
	`aiNotes` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `subscriptionPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('inactive','pending','active','rejected') DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` enum('monthly','seasonal','yearly');--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;