import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/auth";
import { clientAddress, isSameOrigin } from "@/lib/request";
import { allowRequest } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { deletePrivateMedia, isMediaStorageAvailable, savePrivateMedia } from "@/lib/media-storage";

export const runtime = "nodejs";
const maxBytes = 8 * 1024 * 1024;
const maxPixels = 24_000_000;
const acceptedFormats = new Set(["jpeg", "png", "webp"]);

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Richiesta non valida." }, { status: 403 });
  try {
    if (!await getActiveAdminSession()) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  } catch { return NextResponse.json({ error: "Il servizio media non è disponibile." }, { status: 503 }); }
  if (!await allowRequest("media", clientAddress(request), 40, 60 * 60 * 1000)) return NextResponse.json({ error: "Hai raggiunto il limite di caricamenti per questa ora." }, { status: 429 });

  try {
    if (!isMediaStorageAvailable()) return NextResponse.json({ error: "Configura lo storage immagini nelle variabili d’ambiente." }, { status: 503 });
  } catch { return NextResponse.json({ error: "La configurazione dello storage immagini non è valida." }, { status: 503 }); }

  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "File non valido." }, { status: 400 }); }
  const file = form.get("file");
  const altText = String(form.get("altText") ?? "").trim();
  if (!(file instanceof File) || !altText || altText.length > 300 || file.size === 0 || file.size > maxBytes) {
    return NextResponse.json({ error: "Scegli un’immagine valida (massimo 8 MB) e inserisci un testo alternativo." }, { status: 400 });
  }

  const inputBytes = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    const image = sharp(inputBytes, { limitInputPixels: maxPixels, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || !metadata.format || !acceptedFormats.has(metadata.format)) {
      return NextResponse.json({ error: "Sono supportate immagini JPEG, PNG o WebP valide." }, { status: 415 });
    }
    if (metadata.width * metadata.height > maxPixels) return NextResponse.json({ error: "L’immagine supera la risoluzione massima consentita." }, { status: 413 });
    output = await sharp(inputBytes, { limitInputPixels: maxPixels, failOn: "warning", animated: false })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Il file non contiene un’immagine leggibile." }, { status: 415 });
  }
  if (!output.byteLength || output.byteLength > maxBytes) return NextResponse.json({ error: "L’immagine ottimizzata supera il limite consentito." }, { status: 413 });

  const key = "media/" + randomUUID() + ".webp";
  let uploaded = false;
  try {
    await savePrivateMedia(key, output, "image/webp");
    uploaded = true;
    const asset = await prisma.mediaAsset.create({ data: { storageKey: key, url: key, altText, mimeType: "image/webp", sizeBytes: output.byteLength } });
    return NextResponse.json({ id: asset.id, url: "/api/media/" + asset.id, altText: asset.altText, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes }, { status: 201 });
  } catch (error) {
    if (uploaded) await deletePrivateMedia(key).catch(() => undefined);
    console.error("Image upload failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Caricamento non riuscito. Verifica la configurazione dello storage." }, { status: 503 });
  }
}
