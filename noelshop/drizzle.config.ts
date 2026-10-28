import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error("Set POSTGRES_URL_NON_POOLING, POSTGRES_URL or DATABASE_URL before running database migrations");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/postgres",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
});
