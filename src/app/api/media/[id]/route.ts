import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPublicBeforeAfterMedia } from "@/lib/before-after";
import { loadPrivateMedia } from "@/lib/media-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-z0-9]+$/i.test(id)) return new Response(null, { status: 404 });
  try {
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return new Response(null, { status: 404 });
    const now = new Date();
    const [article, recipe, caseItem] = await Promise.all([
      prisma.article.findFirst({ where: { coverMediaId: id, published: true, publishedAt: { lte: now } }, select: { id: true } }),
      prisma.recipe.findFirst({ where: { mediaAssetId: id, published: true, publishedAt: { lte: now } }, select: { id: true } }),
      isPublicBeforeAfterMedia(id),
    ]);
    if (!article && !recipe && !caseItem) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

    const bytes = await loadPrivateMedia(asset.storageKey);
    if (!bytes) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(bytes, { headers: { "Content-Type": asset.mimeType, "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
  } catch (error) {
    console.error("Image retrieval failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Immagine non disponibile." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
