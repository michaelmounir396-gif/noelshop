CREATE TABLE `products` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(160) NOT NULL,
  `eyebrow` varchar(160) NOT NULL,
  `price` int NOT NULL,
  `oldPrice` int,
  `description` text NOT NULL,
  `stock` int NOT NULL DEFAULT 0,
  `active` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
INSERT INTO `products` (`name`, `eyebrow`, `price`, `oldPrice`, `description`, `stock`, `active`) VALUES ('صندوق ليلة العيد', 'هدية Noel الموسمية', 799, 999, 'تفصيلة دافئة، مغلّفة بعناية، وتوصل إحساس العيد من أول لحظة. صندوق أنيق لمن تحب، بدون حيرة ولا لفّ كتير.', 24, 1);
