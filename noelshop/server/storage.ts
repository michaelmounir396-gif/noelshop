import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env.js";

type UploadLink = { key: string; url: string; uploadUrl: string; headers: Record<string, string> };
type S3Config = { bucket: string; region: string; publicUrl: string; client: S3Client };
let s3Config: S3Config | null = null;

function getS3Config(): S3Config | null {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicUrl = process.env.S3_PUBLIC_URL;
  const endpoint = process.env.S3_ENDPOINT;
  const configured = [bucket, region, accessKeyId, secretAccessKey, publicUrl, endpoint].some(Boolean);
  if (!configured) return null;
  if (!bucket || !region || !accessKeyId || !secretAccessKey || !publicUrl) {
    throw new Error("S3 config incomplete: set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_PUBLIC_URL");
  }
  if (!s3Config) {
    s3Config = {
      bucket,
      region,
      publicUrl: publicUrl.replace(/\/+$/, ""),
      client: new S3Client({
        region,
        ...(endpoint ? { endpoint } : {}),
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: { accessKeyId, secretAccessKey },
      }),
    };
  }
  return s3Config;
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) return null;
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function getBackend() {
  const s3 = getS3Config();
  if (s3) return { type: "s3" as const, config: s3 };
  // Manus storage's /manus-storage delivery route is platform-specific.
  if (process.env.VERCEL) {
    throw new Error("Vercel media storage is not configured; set the S3_* environment variables");
  }
  const forge = getForgeConfig();
  if (forge) return { type: "forge" as const, config: forge };
  throw new Error("Storage config missing: configure S3_* variables or Manus storage credentials");
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const safe = relKey.split("/").map(part => part.replace(/[^a-zA-Z0-9._-]/g, "_")).join("/");
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = safe.lastIndexOf(".");
  if (lastDot === -1) return `${safe}_${hash}`;
  return `${safe.slice(0, lastDot)}_${hash}${safe.slice(lastDot)}`;
}

function publicObjectUrl(publicUrl: string, key: string) {
  return `${publicUrl.replace(/\/+$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function storageCreateUpload(relKey: string, contentType = "application/octet-stream"): Promise<UploadLink> {
  const backend = getBackend();
  const key = appendHashSuffix(normalizeKey(relKey));
  if (backend.type === "s3") {
    const command = new PutObjectCommand({ Bucket: backend.config.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(backend.config.client, command, { expiresIn: 300 });
    return {
      key,
      url: publicObjectUrl(backend.config.publicUrl, key),
      uploadUrl,
      headers: { "Content-Type": contentType },
    };
  }

  const presignUrl = new URL("v1/storage/presign/put", backend.config.forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const response = await fetch(presignUrl, { headers: { Authorization: `Bearer ${backend.config.forgeKey}` } });
  if (!response.ok) throw new Error(`Storage presign failed (${response.status})`);
  const { url: uploadUrl } = (await response.json()) as { url: string };
  if (!uploadUrl) throw new Error("Storage returned an empty upload URL");
  return { key, url: `/manus-storage/${key}`, uploadUrl, headers: { "Content-Type": contentType } };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const upload = await storageCreateUpload(relKey, contentType);
  const body = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data as any], { type: contentType });
  const response = await fetch(upload.uploadUrl, { method: "PUT", headers: upload.headers, body });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status})`);
  return { key: upload.key, url: upload.url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const backend = getBackend();
  return { key, url: backend.type === "s3" ? publicObjectUrl(backend.config.publicUrl, key) : `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  const backend = getBackend();
  if (backend.type === "s3") {
    return getSignedUrl(backend.config.client, new GetObjectCommand({ Bucket: backend.config.bucket, Key: key }), { expiresIn: 300 });
  }
  const getUrl = new URL("v1/storage/presign/get", backend.config.forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const response = await fetch(getUrl, { headers: { Authorization: `Bearer ${backend.config.forgeKey}` } });
  if (!response.ok) throw new Error(`Storage signed URL failed (${response.status})`);
  const { url } = (await response.json()) as { url: string };
  if (!url) throw new Error("Storage did not return a download URL");
  return url;
}
