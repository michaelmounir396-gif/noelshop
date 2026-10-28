CREATE TABLE `siteSettings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `announcement` varchar(255) NOT NULL,
  `heroKicker` varchar(160) NOT NULL,
  `heroTitle` varchar(255) NOT NULL,
  `heroAccent` varchar(255) NOT NULL,
  `heroDescription` text NOT NULL,
  `popupEnabled` int NOT NULL DEFAULT 1,
  `popupTitle` varchar(255) NOT NULL,
  `popupDescription` varchar(500) NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
INSERT INTO `siteSettings` (`announcement`, `heroKicker`, `heroTitle`, `heroAccent`, `heroDescription`, `popupEnabled`, `popupTitle`, `popupDescription`) VALUES ('شحن مجاني للطلبات المؤكدة قبل 15 ديسمبر', 'مجموعة شتاء 2026', 'خلّي الهدية', 'توصل قبل الكلام.', 'صندوق ليلة العيد معمول للحظات اللي تستاهل تتغلف بحب — قطعة واحدة، وإحساس كبير.', 1, 'لحظة حلوة\nتستاهل تتعاش.', 'مجموعة شوكولاتة دافئة للحظات القريبة.');
