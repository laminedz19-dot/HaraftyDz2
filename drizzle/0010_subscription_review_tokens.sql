CREATE TABLE `subscriptionReviewTokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `paymentId` int NOT NULL,
  `tokenHash` varchar(64) NOT NULL,
  `action` enum('approve','reject') NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `subscriptionReviewTokens_id` PRIMARY KEY(`id`),
  CONSTRAINT `subscriptionReviewTokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
