import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const orderStatus = pgEnum("order_status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  eyebrow: varchar("eyebrow", { length: 160 }).notNull(),
  price: integer("price").notNull(),
  oldPrice: integer("oldPrice"),
  description: text("description").notNull(),
  stock: integer("stock").default(0).notNull(),
  active: integer("active").default(1).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const siteSettings = pgTable("siteSettings", {
  id: serial("id").primaryKey(),
  announcement: varchar("announcement", { length: 255 }).notNull(),
  heroKicker: varchar("heroKicker", { length: 160 }).notNull(),
  heroTitle: varchar("heroTitle", { length: 255 }).notNull(),
  heroAccent: varchar("heroAccent", { length: 255 }).notNull(),
  heroDescription: text("heroDescription").notNull(),
  popupEnabled: integer("popupEnabled").default(1).notNull(),
  popupTitle: varchar("popupTitle", { length: 255 }).notNull(),
  popupDescription: varchar("popupDescription", { length: 500 }).notNull(),
  productImageUrl: varchar("productImageUrl", { length: 1000 }).default("/product-noel.jpg").notNull(),
  bannerVideoUrl: varchar("bannerVideoUrl", { length: 1000 }).default("/noel-product-banner.mp4").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 24 }).notNull().unique(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  address: text("address").notNull(),
  note: text("note"),
  productName: varchar("productName", { length: 160 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unitPrice").notNull(),
  total: integer("total").notNull(),
  status: orderStatus("status").default("pending").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
