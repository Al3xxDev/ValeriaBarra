import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeforeAfterImages } from "@/components/before-after-card";
import { getPublicBeforeAfterCase } from "@/lib/before-after";
import { toBeforeAfterCardData } from "@/lib/before-after-view";

export const dynamic = "force-dynamic";

const safeMetadataTitle = "Una storia di percorso";
const safeMetadataDescription = "Un’esperienza di percorso nutrizionale condivisa con consenso e nel rispetto della riservatezza.";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicBeforeAfterCase(slug);
  if (!item) return { title: "Storia non disponibile", robots: { index: false, follow: false }, alternates: { canonical: "/prima-e-dopo/" + slug } };
  return {
    title: safeMetadataTitle,
    alternates: { canonical: "/prima-e-dopo/" + item.slug },
    openGraph: { title: safeMetadataTitle, description: safeMetadataDescription, url: "/prima-e-dopo/" + item.slug, type: "article", images: ["/images/tavola-mediterranea-placeholder.png"] },
    robots: { index: true, follow: true },
  };
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getPublicBeforeAfterCase(slug);
  if (!item) notFound();

  const images = toBeforeAfterCardData(item);

  return (
    <article className="story-detail-page page-gutter">
      <nav className="breadcrumbs" aria-label="Percorso"><Link href="/">Home</Link><span>/</span><Link href="/prima-e-dopo">Storie di percorso</Link><span>/</span><span aria-current="page">{item.title}</span></nav>
      <header className="story-detail-header">
        {item.isDemo && <span className="story-demo-label">Esempio dimostrativo · nessuna persona reale</span>}
        <span className="eyebrow">Una storia, senza etichette</span>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
      </header>
      <BeforeAfterImages item={images} />
      <div className="story-detail-grid">
        {item.goal && <section><span className="eyebrow">Obiettivo</span><p>{item.goal}</p></section>}
        {item.journey && <section><span className="eyebrow">Il percorso</span><p>{item.journey}</p></section>}
        {item.resultDescription && <section><span className="eyebrow">Un cambiamento personale</span><p>{item.resultDescription}</p></section>}
        {item.duration && <section><span className="eyebrow">Durata</span><p>{item.duration}</p></section>}
      </div>
      {item.testimonial && <blockquote className="story-testimonial"><span className="eyebrow">Una voce condivisa con consenso</span><p>“{item.testimonial}”</p></blockquote>}
      <p className="story-detail-note">Ogni esperienza è personale e non costituisce una promessa di risultati. Le immagini e il racconto sono condivisi con consenso esplicito.</p>
      <div className="story-detail-actions"><Link className="text-link" href="/prima-e-dopo">← Torna alle storie</Link><Link className="button" href="/prenota">Parliamo del tuo percorso <span aria-hidden="true">↗</span></Link></div>
    </article>
  );
}
