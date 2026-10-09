import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { BeforeAfterStatus, BookingStatus, ConsentScope, Prisma } from "@prisma/client";
import { z } from "zod";
import { getActiveAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";
import { prisma } from "@/lib/prisma";
import { beforeAfterCaseSchema, mediaAssetId, publicationIssues } from "@/lib/before-after-validation";
import { deletePrivateMedia, privateMediaExists } from "@/lib/media-storage";

const articleSchema = z.object({
  id: z.string().optional(), title: z.string().trim().min(3).max(180), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  subtitle: z.string().max(240).optional(), content: z.string().min(20).max(30000), category: z.string().max(80).optional(),
  published: z.boolean().default(false), seoTitle: z.string().max(180).optional(), seoDescription: z.string().max(320).optional(), coverImage: z.string().max(500).optional(), coverAlt: z.string().max(300).optional(), author: z.string().max(120).optional(), socialImage: z.string().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});
const recipeSchema = z.object({
  id: z.string().optional(), title: z.string().trim().min(3).max(180), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  description: z.string().min(10).max(500), ingredients: z.array(z.string().min(1).max(160)).min(1).max(30),
  method: z.array(z.string().min(1).max(1000)).min(1).max(30), prepMinutes: z.number().int().min(1).max(600).optional(),
  difficulty: z.string().max(40).optional(), category: z.string().max(80).optional(), published: z.boolean().default(false), image: z.string().max(500).optional(), imageAlt: z.string().max(300).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});
const statusSchema = z.object({ status: z.nativeEnum(BookingStatus), internalNotes: z.string().max(3000).optional() });

async function authorized(request: Request) {
  if (!isSameOrigin(request)) return false;
  return Boolean(await getActiveAdminSession());
}

async function removeUnreferencedMedia(ids: Array<string | null | undefined>) {
  for (const id of new Set(ids.filter((value): value is string => Boolean(value)))) {
    try {
      const storageKey = await prisma.$transaction(async (tx) => {
        const asset = await tx.mediaAsset.findUnique({ where: { id }, select: { storageKey: true } });
        if (!asset) return null;
        const [articles, recipes, beforeCases, afterCases] = await Promise.all([
          tx.article.count({ where: { coverMediaId: id } }),
          tx.recipe.count({ where: { mediaAssetId: id } }),
          tx.beforeAfterCase.count({ where: { imageBeforeId: id } }),
          tx.beforeAfterCase.count({ where: { imageAfterId: id } }),
        ]);
        if (articles || recipes || beforeCases || afterCases) return null;
        await tx.mediaAsset.delete({ where: { id } });
        return asset.storageKey;
      });
      if (storageKey) await deletePrivateMedia(storageKey);
    } catch (error) {
      console.error("Unreferenced media cleanup failed", error instanceof Error ? error.name : "unknown");
    }
  }
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  if (!await authorized(request)) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  const { resource } = await context.params;
  try {
    if (resource === "bookings") {
      const url = new URL(request.url);
      const q = url.searchParams.get("q")?.trim();
      const status = url.searchParams.get("status");
      const bookings = await prisma.booking.findMany({
        where: {
          ...(status && Object.values(BookingStatus).includes(status as BookingStatus) ? { status: status as BookingStatus } : {}),
          ...(q ? { OR: ["firstName", "lastName", "email", "phone"].map((field) => ({ [field]: { contains: q, mode: "insensitive" as const } })) } : {}),
        }, orderBy: { createdAt: "desc" }, take: 200,
      });
      return NextResponse.json(bookings);
    }
    if (resource === "articles") return NextResponse.json(await prisma.article.findMany({ orderBy: { updatedAt: "desc" }, include: { category: true, tags: true, coverMedia: true } }));
    if (resource === "recipes") return NextResponse.json(await prisma.recipe.findMany({ orderBy: { updatedAt: "desc" }, include: { category: true, tags: true, mediaAsset: true } }));
    if (resource === "cases") return NextResponse.json(await prisma.beforeAfterCase.findMany({ orderBy: { updatedAt: "desc" }, include: { beforeMedia: true, afterMedia: true, consentRecords: { orderBy: { recordedAt: "desc" } } } }));
    return NextResponse.json({ error: "Risorsa non trovata." }, { status: 404 });
  } catch (error) {
    console.error("Admin resource read failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Non è stato possibile caricare i dati." }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  if (!await authorized(request)) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Dati non validi." }, { status: 400 }); }
  const { resource } = await context.params;
  try {
    if (resource === "bookings") {
      const parsed = statusSchema.extend({ id: z.string().min(1) }).safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
      const item = await prisma.booking.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status, internalNotes: parsed.data.internalNotes } });
      return NextResponse.json(item);
    }
    if (resource === "articles") {
      const parsed = articleSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Controlla i campi dell’articolo." }, { status: 400 });
      const data = parsed.data;
      const category = data.category ? await prisma.category.upsert({ where: { name: data.category }, create: { name: data.category, slug: data.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }, update: {} }) : null;
      const existing = data.id ? await prisma.article.findUnique({ where: { id: data.id } }) : null;
      const coverMediaId = mediaAssetId(data.coverImage);
      const values = { title: data.title, slug: data.slug, subtitle: data.subtitle, content: data.content, published: data.published, publishedAt: data.published ? existing?.publishedAt ?? new Date() : null, seoTitle: data.seoTitle, seoDescription: data.seoDescription, socialImage: data.socialImage, author: data.author, coverImage: coverMediaId ? null : data.coverImage || null, coverAlt: data.coverAlt };
      const tagLinks = (data.tags ?? []).map((name) => ({ where: { name }, create: { name } }));
      const item = existing
        ? await prisma.article.update({ where: { id: existing.id }, data: { ...values, coverMedia: coverMediaId ? { connect: { id: coverMediaId } } : { disconnect: true }, category: category ? { connect: { id: category.id } } : { disconnect: true }, tags: { set: [], connectOrCreate: tagLinks } } })
        : await prisma.article.create({ data: { ...values, ...(coverMediaId ? { coverMedia: { connect: { id: coverMediaId } } } : {}), ...(category ? { category: { connect: { id: category.id } } } : {}), ...(tagLinks.length ? { tags: { connectOrCreate: tagLinks } } : {}) } });
      revalidatePath("/", "layout"); revalidatePath("/news/[slug]", "page"); revalidatePath("/sitemap.xml");
      return NextResponse.json(item, { status: existing ? 200 : 201 });
    }
    if (resource === "recipes") {
      const parsed = recipeSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Controlla i campi della ricetta." }, { status: 400 });
      const data = parsed.data;
      const category = data.category ? await prisma.category.upsert({ where: { name: data.category }, create: { name: data.category, slug: data.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }, update: {} }) : null;
      const existing = data.id ? await prisma.recipe.findUnique({ where: { id: data.id } }) : null;
      const recipeMediaId = mediaAssetId(data.image);
      const values = { title: data.title, slug: data.slug, description: data.description, published: data.published, publishedAt: data.published ? existing?.publishedAt ?? new Date() : null, prepMinutes: data.prepMinutes, difficulty: data.difficulty, image: recipeMediaId ? null : data.image || null, imageAlt: data.imageAlt, ingredients: data.ingredients as Prisma.InputJsonValue, method: data.method as Prisma.InputJsonValue };
      const tagLinks = (data.tags ?? []).map((name) => ({ where: { name }, create: { name } }));
      const item = existing
        ? await prisma.recipe.update({ where: { id: existing.id }, data: { ...values, mediaAsset: recipeMediaId ? { connect: { id: recipeMediaId } } : { disconnect: true }, category: category ? { connect: { id: category.id } } : { disconnect: true }, tags: { set: [], connectOrCreate: tagLinks } } })
        : await prisma.recipe.create({ data: { ...values, ...(recipeMediaId ? { mediaAsset: { connect: { id: recipeMediaId } } } : {}), ...(category ? { category: { connect: { id: category.id } } } : {}), ...(tagLinks.length ? { tags: { connectOrCreate: tagLinks } } : {}) } });
      revalidatePath("/", "layout"); revalidatePath("/ricette/[slug]", "page"); revalidatePath("/sitemap.xml");
      return NextResponse.json(item, { status: existing ? 200 : 201 });
    }
    if (resource === "cases") {
      const parsed = beforeAfterCaseSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Controlla i campi del caso." }, { status: 400 });
      const data = parsed.data;
      const beforeMediaId = mediaAssetId(data.imageBefore);
      const afterMediaId = mediaAssetId(data.imageAfter);
      const item = await prisma.$transaction(async (tx) => {
        const existing = data.id ? await tx.beforeAfterCase.findUnique({ where: { id: data.id }, select: { id: true, status: true, contentConsent: true, imagesConsent: true, anonymized: true, isDemo: true, consentRecordedAt: true, publishedAt: true, imageBeforeId: true, imageAfterId: true } }) : null;
        if (data.id && !existing) return null;
        const contentConsentChanged = data.contentConsent !== Boolean(existing?.contentConsent);
        const imagesConsentChanged = data.imagesConsent !== Boolean(existing?.imagesConsent);
        const grantingContent = data.contentConsent && contentConsentChanged;
        const grantingImages = data.imagesConsent && imagesConsentChanged;
        if (grantingContent && !data.contentConsentNotes) return { error: "Aggiungi una nota che indichi dove è conservata la prova del consenso sui contenuti." as const };
        if (grantingImages && !data.imagesConsentNotes) return { error: "Aggiungi una nota che indichi dove è conservata la prova del consenso sulle immagini." as const };

        const activeConsent = async (scope: ConsentScope) => Boolean(existing && await tx.consentRecord.findFirst({
          where: { caseId: existing.id, scope, granted: true, withdrawnAt: null },
          select: { id: true },
        }));
        const contentEvidence = data.contentConsent && (grantingContent || await activeConsent(ConsentScope.CONTENT));
        const imagesEvidence = data.imagesConsent && (grantingImages || await activeConsent(ConsentScope.IMAGES));
        const issues = publicationIssues(data);
        if (data.status === BeforeAfterStatus.PUBLISHED && existing?.isDemo && process.env.NODE_ENV === "production" && process.env.STORAGE_LOCAL !== "true") issues.push("un contenuto dimostrativo non può essere pubblicato in produzione");

        const mediaItems = beforeMediaId && afterMediaId
          ? await tx.mediaAsset.findMany({ where: { id: { in: [beforeMediaId, afterMediaId] } }, select: { id: true, storageKey: true, mimeType: true, sizeBytes: true, altText: true } })
          : [];
        if (data.status === BeforeAfterStatus.PUBLISHED) {
          if (mediaItems.length !== 2 || !beforeMediaId || !afterMediaId) issues.push("le due immagini presenti nello storage");
          for (const asset of mediaItems) {
            const supportedType = ["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)
              || (existing?.isDemo === true && asset.mimeType === "image/svg+xml");
            if (!supportedType || asset.sizeBytes <= 0 || !asset.altText.trim()) issues.push("due file immagine validi con testo alternativo");
          }
          if (!contentEvidence) issues.push("una registrazione attiva del consenso ai contenuti");
          if (!imagesEvidence) issues.push("una registrazione attiva del consenso alle immagini");
          if (mediaItems.length === 2) {
            const available = await Promise.all(mediaItems.map((asset) => privateMediaExists(asset.storageKey)));
            if (available.some((exists) => !exists)) issues.push("due immagini effettivamente disponibili nello storage");
          }
        }

        const withdrawingConsent = (existing?.contentConsent && !data.contentConsent)
          || (existing?.imagesConsent && !data.imagesConsent)
          || (existing?.anonymized && !data.anonymized);
        const status = data.status === BeforeAfterStatus.PUBLISHED
          && existing?.status === BeforeAfterStatus.PUBLISHED
          && (issues.length > 0 || withdrawingConsent)
          ? BeforeAfterStatus.DRAFT
          : data.status;
        if (status === BeforeAfterStatus.PUBLISHED && issues.length > 0) {
          return { error: "Non è possibile pubblicare: completa " + issues.join(", ") + "." };
        }

        const now = new Date();
        const values = {
          title: data.title,
          slug: data.slug,
          description: data.description,
          goal: data.goal || null,
          journey: data.journey || null,
          duration: data.duration || null,
          resultDescription: data.resultDescription || null,
          testimonial: data.testimonial || null,
          imageBefore: null,
          imageAfter: null,
          imageBeforeAlt: data.imageBeforeAlt || null,
          imageAfterAlt: data.imageAfterAlt || null,
          contentConsent: data.contentConsent,
          imagesConsent: data.imagesConsent,
          anonymized: data.anonymized,
          status,
          publishedAt: status === BeforeAfterStatus.PUBLISHED
            ? existing?.status === BeforeAfterStatus.PUBLISHED ? existing.publishedAt ?? now : now
            : null,
          consentRecordedAt: data.contentConsent
            ? grantingContent ? now : existing?.consentRecordedAt ?? now
            : null,
        };
        const saved = existing
          ? await tx.beforeAfterCase.update({ where: { id: existing.id }, data: { ...values, beforeMedia: beforeMediaId ? { connect: { id: beforeMediaId } } : { disconnect: true }, afterMedia: afterMediaId ? { connect: { id: afterMediaId } } : { disconnect: true } } })
          : await tx.beforeAfterCase.create({ data: { ...values, isDemo: false, ...(beforeMediaId ? { beforeMedia: { connect: { id: beforeMediaId } } } : {}), ...(afterMediaId ? { afterMedia: { connect: { id: afterMediaId } } } : {}) } });

        const writeConsentChange = async (scope: ConsentScope, changed: boolean, granted: boolean, notes: string) => {
          if (!changed) return;
          if (!granted) await tx.consentRecord.updateMany({ where: { caseId: saved.id, scope, granted: true, withdrawnAt: null }, data: { withdrawnAt: now } });
          await tx.consentRecord.create({ data: {
            caseId: saved.id,
            scope,
            granted,
            recordedAt: now,
            withdrawnAt: granted ? null : now,
            notes: notes || (granted ? null : "Consenso ritirato dall’amministrazione."),
          } });
        };
        await writeConsentChange(ConsentScope.CONTENT, contentConsentChanged, data.contentConsent, data.contentConsentNotes);
        await writeConsentChange(ConsentScope.IMAGES, imagesConsentChanged, data.imagesConsent, data.imagesConsentNotes);
        return {
          saved,
          oldMediaIds: existing ? [existing.imageBeforeId, existing.imageAfterId] : [],
          statusChangedByWithdrawal: Boolean(existing?.status === BeforeAfterStatus.PUBLISHED && status === BeforeAfterStatus.DRAFT),
        };
      });
      if (!item) return NextResponse.json({ error: "Caso non trovato." }, { status: 404 });
      if ("error" in item) return NextResponse.json({ error: item.error }, { status: 400 });
      await removeUnreferencedMedia(item.oldMediaIds.filter((id) => id !== beforeMediaId && id !== afterMediaId));
      revalidatePath("/", "page");
      revalidatePath("/prima-e-dopo");
      revalidatePath("/prima-e-dopo/[slug]", "page");
      revalidatePath("/prima-e-dopo/" + data.slug, "page");
      revalidatePath("/sitemap.xml");
      return NextResponse.json({ ...item.saved, statusChangedByWithdrawal: item.statusChangedByWithdrawal }, { status: data.id ? 200 : 201 });
    }
    return NextResponse.json({ error: "Risorsa non trovata." }, { status: 404 });
  } catch (error) {
    console.error("Admin resource save failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Salvataggio non riuscito. Verifica che lo slug non sia già in uso." }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ resource: string }> }) {
  if (!await authorized(request)) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  const { resource } = await context.params;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Elemento non specificato." }, { status: 400 });
  try {
    if (resource === "articles") await prisma.article.delete({ where: { id } });
    else if (resource === "recipes") await prisma.recipe.delete({ where: { id } });
    else if (resource === "cases") {
      const item = await prisma.beforeAfterCase.findUnique({ where: { id }, select: { imageBeforeId: true, imageAfterId: true } });
      await prisma.beforeAfterCase.delete({ where: { id } });
      if (item) await removeUnreferencedMedia([item.imageBeforeId, item.imageAfterId]);
    }
    else return NextResponse.json({ error: "Operazione non consentita." }, { status: 403 });
    revalidatePath("/", "layout");
    if (resource === "articles") { revalidatePath("/news"); revalidatePath("/news/[slug]", "page"); }
    if (resource === "recipes") { revalidatePath("/ricette"); revalidatePath("/ricette/[slug]", "page"); }
    if (resource === "cases") { revalidatePath("/", "page"); revalidatePath("/prima-e-dopo"); revalidatePath("/prima-e-dopo/[slug]", "page"); }
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin resource delete failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Non è stato possibile completare l’operazione." }, { status: 404 });
  }
}
