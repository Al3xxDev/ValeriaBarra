import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadPrivateMedia } from "@/lib/media-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!await getActiveAdminSession()) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Il servizio media non è disponibile." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  const { id } = await context.params;
  if (!/^[a-z0-9]+$/i.test(id)) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  try {
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    const bytes = await loadPrivateMedia(asset.storageKey);
    if (!bytes) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(bytes, { headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  } catch (error) {
    console.error("Private media preview failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Immagine non disponibile." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
