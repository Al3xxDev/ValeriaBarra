import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

type StorageConfig =
  | { mode: "s3"; bucket: string; client: S3Client }
  | { mode: "database" }
  | { mode: "local"; root: string };

let cachedStorage: StorageConfig | null | undefined;

function getStorage(): StorageConfig {
  if (cachedStorage !== undefined && cachedStorage !== null) return cachedStorage;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.STORAGE_SECRET_KEY;
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (bucket && accessKeyId && secretAccessKey) {
    cachedStorage = {
      mode: "s3",
      bucket,
      client: new S3Client({ region: process.env.STORAGE_REGION ?? "eu-central-1", ...(endpoint ? { endpoint, forcePathStyle: true } : {}), credentials: { accessKeyId, secretAccessKey } }),
    };
    return cachedStorage;
  }
  if (bucket || accessKeyId || secretAccessKey) throw new Error("La configurazione S3 è incompleta.");
  if (process.env.STORAGE_LOCAL === "true" && process.env.NODE_ENV !== "production") {
    cachedStorage = { mode: "local", root: path.resolve(process.cwd(), ".private-media") };
    return cachedStorage;
  }
  cachedStorage = { mode: "database" };
  return cachedStorage;
}

function localPath(root: string, key: string) {
  if (!/^media\/[a-f0-9-]+\.webp$/i.test(key)) throw new Error("Chiave media non valida.");
  const absolute = path.resolve(root, key);
  if (!absolute.startsWith(root + path.sep)) throw new Error("Chiave media non valida.");
  return absolute;
}

export function isMediaStorageAvailable() {
  try {
    return Boolean(getStorage());
  } catch {
    return false;
  }
}

export async function savePrivateMedia(key: string, bytes: Uint8Array, contentType: string) {
  const storage = getStorage();
  if (storage.mode === "s3") {
    await storage.client.send(new PutObjectCommand({ Bucket: storage.bucket, Key: key, Body: bytes, ContentType: contentType, CacheControl: "private, no-store" }));
    return;
  }
  if (storage.mode === "database") {
    const payload = Buffer.from(bytes) as unknown as Uint8Array<ArrayBuffer>;
    await prisma.mediaPayload.upsert({
      where: { key },
      create: { key, bytes: payload, contentType },
      update: { bytes: payload, contentType },
    });
    // Optional local mirror for fast dev-time inspection
    if (process.env.NODE_ENV !== "production") {
      try {
        const devPath = localPath(path.resolve(process.cwd(), ".private-media"), key);
        await mkdir(path.dirname(devPath), { recursive: true, mode: 0o700 });
        await writeFile(devPath, bytes, { mode: 0o600 });
      } catch {
        // Non-blocking in dev
      }
    }
    return;
  }
  const filePath = localPath(storage.root, key);
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await writeFile(filePath, bytes, { flag: "wx", mode: 0o600 });
}

export async function loadPrivateMedia(key: string) {
  if (key.startsWith("demo/")) {
    const filename = key.slice("demo/".length);
    if (!/^[a-z0-9-]+\.svg$/i.test(filename)) throw new Error("Chiave demo non valida.");
    return new Uint8Array(await readFile(path.resolve(process.cwd(), "public", "images", filename)));
  }
  const storage = getStorage();
  if (storage.mode === "s3") {
    const object = await storage.client.send(new GetObjectCommand({ Bucket: storage.bucket, Key: key }));
    const bytes = await object.Body?.transformToByteArray();
    return bytes ? new Uint8Array(bytes) : null;
  }
  if (storage.mode === "database") {
    try {
      const item = await prisma.mediaPayload.findUnique({
        where: { key },
        select: { bytes: true },
      });
      if (item) return new Uint8Array(item.bytes);
    } catch (error) {
      console.error("Database media read failed", error instanceof Error ? error.message : "unknown");
    }
    // Fallback: check if the file was written to local disk in a previous dev run
    try {
      const fallbackFile = path.resolve(process.cwd(), ".private-media", key);
      return new Uint8Array(await readFile(/* turbopackIgnore: true */ fallbackFile));
    } catch {
      return null;
    }
  }
  try { return new Uint8Array(await readFile(/* turbopackIgnore: true */ localPath(storage.root, key))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}

export async function privateMediaExists(key: string) {
  if (key.startsWith("demo/")) return (await loadPrivateMedia(key)) !== null;
  const storage = getStorage();
  if (storage.mode === "s3") {
    try { await storage.client.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: key })); return true; }
    catch (error) {
      if (["NotFound", "NoSuchKey", "404"].includes((error as { name?: string }).name ?? "")) return false;
      throw error;
    }
  }
  if (storage.mode === "database") {
    try {
      const count = await prisma.mediaPayload.count({ where: { key } });
      if (count > 0) return true;
    } catch {
      // ignore
    }
    try {
      await access(path.resolve(process.cwd(), ".private-media", key));
      return true;
    } catch {
      return false;
    }
  }
  try { await access(localPath(storage.root, key)); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
}

export async function deletePrivateMedia(key: string) {
  if (key.startsWith("demo/")) return;
  const storage = getStorage();
  if (storage.mode === "s3") {
    await storage.client.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: key }));
    return;
  }
  if (storage.mode === "database") {
    await prisma.mediaPayload.deleteMany({ where: { key } });
    try { await unlink(path.resolve(process.cwd(), ".private-media", key)); } catch { /* ignore */ }
    return;
  }
  try { await unlink(localPath(storage.root, key)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
