CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" varchar(24) NOT NULL,
	"customerName" varchar(160) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"address" text NOT NULL,
	"note" text,
	"productName" varchar(160) NOT NULL,
	"quantity" integer NOT NULL,
	"unitPrice" integer NOT NULL,
	"total" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"eyebrow" varchar(160) NOT NULL,
	"price" integer NOT NULL,
	"oldPrice" integer,
	"description" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siteSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"announcement" varchar(255) NOT NULL,
	"heroKicker" varchar(160) NOT NULL,
	"heroTitle" varchar(255) NOT NULL,
	"heroAccent" varchar(255) NOT NULL,
	"heroDescription" text NOT NULL,
	"popupEnabled" integer DEFAULT 1 NOT NULL,
	"popupTitle" varchar(255) NOT NULL,
	"popupDescription" varchar(500) NOT NULL,
	"productImageUrl" varchar(1000) DEFAULT '/product-noel.jpg' NOT NULL,
	"bannerVideoUrl" varchar(1000) DEFAULT '/noel-product-banner.mp4' NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
INSERT INTO "products" ("name", "eyebrow", "price", "oldPrice", "description", "stock", "active")
VALUES ('صندوق ليلة العيد', 'هدية Noel الموسمية', 799, 999, 'تفصيلة دافئة، مغلّفة بعناية، وتوصل إحساس العيد من أول لحظة. صندوق أنيق لمن تحب، بدون حيرة ولا لفّ كتير.', 24, 1);
--> statement-breakpoint
INSERT INTO "siteSettings" ("announcement", "heroKicker", "heroTitle", "heroAccent", "heroDescription", "popupEnabled", "popupTitle", "popupDescription")
VALUES ('شحن مجاني للطلبات المؤكدة قبل 15 ديسمبر', 'مجموعة شتاء 2026', 'خلّي الهدية', 'توصل قبل الكلام.', 'صندوق ليلة العيد معمول للحظات اللي تستاهل تتغلف بحب — قطعة واحدة، وإحساس كبير.', 1, E'لحظة حلوة\nتستاهل تتعاش.', 'مجموعة شوكولاتة دافئة للحظات القريبة.');
