import type { MetadataRoute } from "next";
import { getArticles, getRecipes } from "@/lib/content";
import { getPublicBeforeAfterCases } from "@/lib/before-after";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/chi-sono", "/percorsi", "/ricette", "/news", "/prenota", "/prima-e-dopo", "/privacy", "/cookie"];
  const [articles, recipes] = await Promise.all([getArticles(), getRecipes()]);
  let stories: Awaited<ReturnType<typeof getPublicBeforeAfterCases>> = [];
  try { stories = await getPublicBeforeAfterCases(); }
  catch (error) { if (process.env.NODE_ENV === "production") console.error("Sitemap stories unavailable", error instanceof Error ? error.name : "unknown"); }
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: route === "" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : 0.6 })),
    ...articles.map((item) => ({ url: `${base}/news/${item.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...recipes.map((item) => ({ url: `${base}/ricette/${item.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...stories.map((item) => ({ url: `${base}/prima-e-dopo/${item.slug}`, lastModified: item.publishedAt ?? item.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
