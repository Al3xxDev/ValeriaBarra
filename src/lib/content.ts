import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { articles as demoArticles, recipes as demoRecipes } from "@/lib/demo-content";

export async function getArticles() {
  try {
    const published = await prisma.article.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      include: { category: true, coverMedia: true }, orderBy: { publishedAt: "desc" },
    });
    return published.map((item) => ({
      title: item.title, slug: item.slug, subtitle: item.subtitle ?? "",
      category: item.category?.name ?? "Approfondimenti",
      date: new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(item.publishedAt ?? item.createdAt),
      image: item.coverMedia ? `/api/media/${item.coverMedia.id}` : item.coverImage ?? "/images/tavola-mediterranea-placeholder.png",
      imageAlt: item.coverMedia?.altText ?? item.coverAlt ?? item.title,
      content: item.content.split("\n\n").filter(Boolean),
      author: item.author, seoTitle: item.seoTitle, seoDescription: item.seoDescription, socialImage: item.socialImage,
    }));
  } catch (error) {
    if (process.env.NODE_ENV === "production") console.error("Published articles unavailable", error instanceof Error ? error.name : "unknown");
  }
  return demoArticles;
}

export async function getRecipes() {
  try {
    const published = await prisma.recipe.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      include: { category: true, mediaAsset: true }, orderBy: { publishedAt: "desc" },
    });
    return published.map((item) => ({
      title: item.title, slug: item.slug, description: item.description,
      category: item.category?.name ?? "Ricette", prepMinutes: item.prepMinutes ?? 20,
      difficulty: item.difficulty ?? "Facile",
      image: item.mediaAsset ? `/api/media/${item.mediaAsset.id}` : item.image ?? "/images/tavola-mediterranea-placeholder.png",
      imageAlt: item.mediaAsset?.altText ?? item.imageAlt ?? item.title,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(String) : [],
      method: Array.isArray(item.method) ? item.method.map(String) : [],
    }));
  } catch (error) {
    if (process.env.NODE_ENV === "production") console.error("Published recipes unavailable", error instanceof Error ? error.name : "unknown");
  }
  return demoRecipes;
}

export const getSiteSettings = cache(async () => {
  const defaults = { name: "Valeria Barra", qualification: "Biologa Nutrizionista", shortBio: "Un percorso nutrizionale costruito intorno alla tua vita, con ascolto e consapevolezza.", city: "Salerno", email: null as string | null, phone: null as string | null, whatsapp: null as string | null, instagram: null as string | null, facebook: null as string | null, ctaLabel: "Prenota un appuntamento", seoTitle: null as string | null, seoDescription: null as string | null };
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });
    return settings ? { ...defaults, ...settings } : defaults;
  } catch {
    return defaults;
  }
});
