import { desc, eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../drizzle/schema.js";
import { InsertOrder, InsertProduct, InsertSiteSettings, InsertUser, orders, products, siteSettings, users } from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

function getConnectionString() {
  // Supabase's Vercel Marketplace integration provides POSTGRES_URL. Keep
  // DATABASE_URL as a fallback for local development and custom setups.
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
}

export async function getDb() {
  const connectionString = getConnectionString();
  if (!_db && connectionString) {
    try {
      sqlClient = postgres(connectionString, {
        // Transaction poolers do not support prepared statements. One connection
        // per warm serverless instance also avoids opening oversized pools.
        prepare: false,
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      _db = drizzle(sqlClient, { schema });
    } catch (error) {
      console.warn("[Database] Failed to initialize:", error);
      sqlClient = null;
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Partial<InsertUser> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      (values as Record<string, unknown>)[field] = user[field] ?? null;
      (updateSet as Record<string, unknown>)[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  updateSet.updatedAt = new Date();
  if (Object.keys(updateSet).length === 1) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");
  const result = await db.insert(orders).values(order).returning({ id: orders.id });
  return result[0]?.id;
}

export async function listOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, status: InsertOrder["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  return { success: true } as const;
}

export async function listProducts() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getActiveProduct() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.active, 1)).orderBy(desc(products.createdAt)).limit(1);
  return result[0];
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");
  const result = await db.insert(products).values(product).returning({ id: products.id });
  return result[0]?.id;
}

export async function updateProduct(id: number, product: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");
  await db.update(products).set({ ...product, updatedAt: new Date() }).where(eq(products.id, id));
  return { success: true } as const;
}

export async function getSiteSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).limit(1);
  return result[0];
}

export async function updateSiteSettings(settings: Partial<InsertSiteSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available; configure POSTGRES_URL or DATABASE_URL");
  const current = await getSiteSettings();
  if (current) {
    await db.update(siteSettings).set({ ...settings, updatedAt: new Date() }).where(eq(siteSettings.id, current.id));
  } else {
    await db.insert(siteSettings).values(settings as InsertSiteSettings);
  }
  return getSiteSettings();
}
