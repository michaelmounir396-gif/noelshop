CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(24) NOT NULL,
	`customerName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`address` text NOT NULL,
	`note` text,
	`productName` varchar(160) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`total` int NOT NULL,
	`status` enum('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
