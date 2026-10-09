import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRecipes } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const recipe = (await getRecipes()).find((item) => item.slug === slug);
  return recipe ? { title: recipe.title, description: recipe.description, alternates: { canonical: `/ricette/${slug}` }, openGraph: { images: [recipe.image] } } : {};
}
export default async function RecipePage({ params }: Props) {
  const { slug } = await params; const recipe = (await getRecipes()).find((item) => item.slug === slug); if (!recipe) notFound();
  return <article className="article-page page-gutter"><nav className="breadcrumbs" aria-label="Percorso"><Link href="/">Home</Link><span>/</span><Link href="/ricette">Ricette</Link><span>/</span><span>{recipe.title}</span></nav><header className="article-header"><span className="eyebrow">{recipe.category} · {recipe.prepMinutes} minuti</span><h1>{recipe.title}</h1><p>{recipe.description}</p></header><figure className="article-cover"><Image unoptimized={recipe.image.startsWith("/api/media/") || /^https?:\/\//i.test(recipe.image)} src={recipe.image} alt={recipe.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 80vw" className="cover-image" /></figure><div className="recipe-detail-grid"><section><span className="eyebrow">Ingredienti</span><ul className="ingredient-list">{recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul></section><section><span className="eyebrow">Preparazione</span><ol className="method-list">{recipe.method.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol></section></div><p className="article-note">Ricetta proposta a scopo informativo. Adatta gli ingredienti alle tue esigenze personali e confrontati con un professionista in caso di necessità specifiche.</p><Link className="text-link back-link" href="/ricette">← Torna alle ricette</Link></article>;
}
