import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(120), qualification: z.string().trim().min(2).max(160),
  shortBio: z.string().trim().min(20).max(420), city: z.string().trim().min(2).max(100),
  email: z.union([z.literal(""), z.email().max(254)]), phone: z.string().max(40), whatsapp: z.string().max(40),
  instagram: z.union([z.literal(""), z.url().max(500)]), facebook: z.union([z.literal(""), z.url().max(500)]),
  ctaLabel: z.string().trim().min(4).max(60), seoTitle: z.string().max(180), seoDescription: z.string().max(320),
});

async function authorized(request: Request) {
  if (!isSameOrigin(request)) return false;
  return Boolean(await getActiveAdminSession());
}

export async function GET(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  try { return NextResponse.json(await prisma.siteSettings.findUnique({ where: { id: "main" } })); }
  catch { return NextResponse.json({ error: "Impostazioni non disponibili." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Dati non validi." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Controlla i campi obbligatori e i link inseriti." }, { status: 400 });
  const data = parsed.data;
  try {
    const settings = await prisma.siteSettings.upsert({ where: { id: "main" }, create: { id: "main", ...data, email: data.email || null, phone: data.phone || null, whatsapp: data.whatsapp || null, instagram: data.instagram || null, facebook: data.facebook || null, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null }, update: { ...data, email: data.email || null, phone: data.phone || null, whatsapp: data.whatsapp || null, instagram: data.instagram || null, facebook: data.facebook || null, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null } });
    revalidatePath("/", "layout");
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Site settings save failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Non è stato possibile salvare le impostazioni." }, { status: 503 });
  }
}
