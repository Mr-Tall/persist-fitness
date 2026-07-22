import "server-only";
import { randomUUID } from "node:crypto";
import { validateScreenshot } from "./storage-validation";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.BETA_FEEDBACK_BUCKET;
  return url && key && bucket ? { url, key, bucket } : null;
}

function storageHeaders(key: string) {
  return { Authorization: `Bearer ${key}`, apikey: key };
}

export async function uploadFeedbackScreenshot(file: File, userId: string) {
  const storage = config();
  if (!storage) throw new Error("Screenshot uploads are not configured.");
  const extension = validateScreenshot(file);
  const path = `${userId}/${randomUUID()}.${extension}`;
  const response = await fetch(
    `${storage.url}/storage/v1/object/${encodeURIComponent(storage.bucket)}/${path}`,
    {
      method: "POST",
      headers: { ...storageHeaders(storage.key), "Content-Type": file.type, "x-upsert": "false" },
      body: file,
    },
  );
  if (!response.ok) throw new Error("Screenshot upload failed.");
  return path;
}

export async function deleteFeedbackScreenshot(path: string) {
  const storage = config();
  if (!storage) throw new Error("Screenshot storage is not configured.");
  const response = await fetch(`${storage.url}/storage/v1/object/${encodeURIComponent(storage.bucket)}`, {
    method: "DELETE",
    headers: { ...storageHeaders(storage.key), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  });
  if (!response.ok) throw new Error("Screenshot deletion failed.");
}

export async function createFeedbackScreenshotUrl(path: string) {
  const storage = config();
  if (!storage) return null;
  const response = await fetch(
    `${storage.url}/storage/v1/object/sign/${encodeURIComponent(storage.bucket)}/${path}`,
    {
      method: "POST",
      headers: { ...storageHeaders(storage.key), "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 300 }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Screenshot access failed.");
  const result = (await response.json()) as { signedURL?: string };
  return result.signedURL ? `${storage.url}/storage/v1${result.signedURL}` : null;
}

export function screenshotStorageConfigured() {
  return Boolean(config());
}
