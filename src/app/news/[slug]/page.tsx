import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticles } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const article = (await getArticles()).find((item) => item.slug === slug);
  return article ? { title: article.seoTitle || article.title, description: article.seoDescription || article.subtitle, alternates: { canonical: `/news/${slug}` }, openGraph: { images: [article.socialImage || article.image] } } : {};
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params; const article = (await getArticles()).find((item) => item.slug === slug); if (!article) notFound();
  return <article className="article-page page-gutter"><nav className="breadcrumbs" aria-label="Percorso"><Link href="/">Home</Link><span>/</span><Link href="/news">Journal</Link><span>/</span><span>{article.title}</span></nav><header className="article-header"><span className="eyebrow">{article.category} · {article.date}</span><h1>{article.title}</h1><p>{article.subtitle}</p><span className="article-byline">A cura di {article.author ?? "Valeria Barra"}</span></header><figure className="article-cover"><Image unoptimized={article.image.startsWith("/api/media/") || /^https?:\/\//i.test(article.image)} src={article.image} alt={article.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 80vw" className="cover-image" /></figure><div className="article-body">{article.content.map((paragraph, index) => index === 0 ? <p className="article-lead" key={paragraph}>{paragraph}</p> : <p key={paragraph}>{paragraph}</p>)}</div><p className="article-note">I contenuti sono informativi e non sostituiscono una valutazione professionale personalizzata.</p><Link className="text-link back-link" href="/news">← Torna al journal</Link></article>;
}
