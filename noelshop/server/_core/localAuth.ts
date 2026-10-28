import crypto from "node:crypto";
import type { Request, Response } from "express";
import { parse as parseCookie } from "cookie";
import type { User } from "../../drizzle/schema.js";
import { getSessionCookieOptions } from "./cookies.js";

export const LOCAL_ADMIN_COOKIE = "noel_admin_session";
const ADMIN_EMAIL = process.env.NOEL_ADMIN_EMAIL?.trim().toLowerCase();
const PASSWORD_SALT = process.env.NOEL_ADMIN_PASSWORD_SALT;
const PASSWORD_HASH = process.env.NOEL_ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.NOEL_ADMIN_SESSION_SECRET;
const adminUser = {
  id: 0,
  openId: "local-admin",
  name: ADMIN_EMAIL?.split("@")[0] || "Store admin",
  email: ADMIN_EMAIL || null,
  loginMethod: "local",
  role: "admin" as const,
  createdAt: new Date(0),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
} as User;

function sign(value: string) {
  return crypto.createHmac("sha256", SESSION_SECRET!).update(value).digest("hex");
}

function validSession(value: string | undefined) {
  if (!SESSION_SECRET || !value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || payload !== "local-admin") return false;
  const expected = sign(payload);
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function getLocalAdmin(req: Request): User | null {
  const value = parseCookie(req.headers.cookie ?? "")[LOCAL_ADMIN_COOKIE];
  return ADMIN_EMAIL && validSession(value) ? adminUser : null;
}

export function verifyLocalCredentials(email: string, password: string) {
  if (!ADMIN_EMAIL || !PASSWORD_SALT || !PASSWORD_HASH || !SESSION_SECRET) return false;
  if (!/^[a-f0-9]{128}$/i.test(PASSWORD_HASH) || email.trim().toLowerCase() !== ADMIN_EMAIL) return false;
  try {
    const derived = crypto.scryptSync(password, PASSWORD_SALT, 64);
    const expected = Buffer.from(PASSWORD_HASH, "hex");
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function setLocalAdminSession(res: Response, req: Request) {
  const payload = "local-admin";
  res.cookie(LOCAL_ADMIN_COOKIE, `${payload}.${sign(payload)}`, {
    ...getSessionCookieOptions(req),
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearLocalAdminSession(res: Response, req: Request) {
  res.clearCookie(LOCAL_ADMIN_COOKIE, { ...getSessionCookieOptions(req), maxAge: 0 });
}
