import Image from "next/image";
import Link from "next/link";
import { BeforeAfterCard } from "@/components/before-after-card";
import { getArticles, getRecipes, getSiteSettings } from "@/lib/content";
import { getPublicBeforeAfterCases } from "@/lib/before-after";
import { toBeforeAfterCardData } from "@/lib/before-after-view";

export default async function Home() {
  const [articles, recipes, settings] = await Promise.all([getArticles(), getRecipes(), getSiteSettings()]);
  let featuredStory = null;
  try {
    const stories = await getPublicBeforeAfterCases();
    if (stories[0]) featuredStory = toBeforeAfterCardData(stories[0]);
  } catch (error) {
    if (process.env.NODE_ENV === "production") console.error("Home stories teaser unavailable", error instanceof Error ? error.name : "unknown");
  }
  const localBusiness = { "@context": "https://schema.org", "@type": "Person", name: settings.name, jobTitle: settings.qualification, url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", address: { "@type": "PostalAddress", addressLocality: settings.city, addressCountry: "IT" }, sameAs: [settings.instagram, settings.facebook].filter(Boolean) };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }} />
    <section className="hero page-gutter">
      <div className="hero-copy">
        <span className="eyebrow hero-eyebrow"><span className="eyebrow-mark" /> {settings.name} · {settings.qualification} · {settings.city}</span>
        <h1>Il benessere<br />comincia <em>da te.</em></h1>
        <p className="hero-lede">{settings.shortBio}</p>
        <div className="hero-actions"><Link className="button" href="/prenota">{settings.ctaLabel} <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/chi-sono">Scopri il mio approccio <span aria-hidden="true">→</span></Link></div>
        <div className="hero-footnote"><span className="small-rule" /> Un passo alla volta, senza formule uguali per tutti.</div>
      </div>
      <figure className="hero-portrait"><Image src="/images/valeria-studio-placeholder.png" alt="Ritratto segnaposto di una professionista nel suo studio luminoso" fill priority sizes="(max-width: 760px) 100vw, 49vw" className="cover-image" /><figcaption><span>Uno spazio di ascolto</span><span>Salerno, Italia</span></figcaption><span className="portrait-stamp" aria-hidden="true">VB<br /><small>· 01 ·</small></span></figure>
    </section>

    <section className="intro-section page-gutter section-pad">
      <div className="section-index"><span className="eyebrow">01 — Un approccio diverso</span><span className="index-flower" aria-hidden="true">✳</span></div>
      <div className="intro-copy"><h2>Non un piano da seguire.<br /><em>Un percorso da vivere.</em></h2><div><p>Credo in una nutrizione che si adatta alla persona, non il contrario. Insieme possiamo dare forma ad abitudini più consapevoli, con indicazioni concrete e uno spazio in cui sentirti ascoltata.</p><Link className="text-link" href="/chi-sono">Conosci Valeria <span aria-hidden="true">→</span></Link></div></div>
    </section>

    <section className="method-section page-gutter section-pad">
      <div className="method-heading"><span className="eyebrow">02 — Come lavoriamo</span><h2>La persona, prima<br /><em>della tabella.</em></h2><p>Un approccio costruito con cura, a partire dalle tue esigenze e dalla tua quotidianità.</p></div>
      <div className="method-steps"><article><span>01</span><div><h3>Ci conosciamo</h3><p>Partiamo da un dialogo aperto sulle tue abitudini, le tue esigenze e ciò che desideri cambiare.</p></div><span aria-hidden="true">↗</span></article><article><span>02</span><div><h3>Troviamo il tuo equilibrio</h3><p>Definiamo indicazioni pratiche, sostenibili e compatibili con le tue giornate.</p></div><span aria-hidden="true">↗</span></article><article><span>03</span><div><h3>Restiamo in ascolto</h3><p>Ci rivediamo per capire cosa funziona, sciogliere i dubbi e adattare il percorso.</p></div><span aria-hidden="true">↗</span></article></div>
    </section>

    <section className="services-section page-gutter section-pad">
      <div className="section-heading-row"><div><span className="eyebrow">03 — I percorsi</span><h2>Un supporto che<br /><em>ti somiglia.</em></h2></div><Link className="text-link" href="/percorsi">Tutti i percorsi <span aria-hidden="true">→</span></Link></div>
      <div className="service-grid"><Link href="/percorsi#prima-visita" className="service-card"><span className="service-no">01</span><span className="service-icon" aria-hidden="true">↗</span><h3>Prima visita</h3><p>Il tempo per ascoltarti, conoscersi e iniziare a costruire il tuo percorso.</p><span className="card-link">Scopri di più <span aria-hidden="true">→</span></span></Link><Link href="/percorsi#controllo" className="service-card"><span className="service-no">02</span><span className="service-icon" aria-hidden="true">↗</span><h3>Controlli</h3><p>Un momento di confronto per osservare i progressi e aggiornare le indicazioni.</p><span className="card-link">Scopri di più <span aria-hidden="true">→</span></span></Link><Link href="/percorsi#educazione" className="service-card"><span className="service-no">03</span><span className="service-icon" aria-hidden="true">↗</span><h3>Educazione alimentare</h3><p>Strumenti e conoscenze per portare più autonomia nelle scelte quotidiane.</p><span className="card-link">Scopri di più <span aria-hidden="true">→</span></span></Link></div>
    </section>

    <section className="quote-band page-gutter"><span className="quote-mark" aria-hidden="true">“</span><blockquote>Prendersi cura di sé non dovrebbe aggiungere peso alla tua giornata. Dovrebbe aiutarti a viverla meglio.</blockquote><span className="eyebrow">Il punto di partenza è la persona.</span></section>

    <section className="journal-section page-gutter section-pad">
      <div className="section-heading-row"><div><span className="eyebrow">04 — Dal journal</span><h2>Idee da portare<br /><em>in tavola e nella vita.</em></h2></div><Link className="text-link" href="/news">Leggi il journal <span aria-hidden="true">→</span></Link></div>
      <div className="editorial-grid">{articles.slice(0, 2).map((article, index) => <Link className={`editorial-card editorial-${index + 1}`} href={`/news/${article.slug}`} key={article.slug}><div className="editorial-image"><Image loading={index === 0 ? "eager" : "lazy"} unoptimized={article.image.startsWith("/api/media/") || /^https?:\/\//i.test(article.image)} src={article.image} alt={article.imageAlt} fill sizes="(max-width: 760px) 100vw, 50vw" className="cover-image" /></div><div className="editorial-meta"><span>{article.category}</span><span>{article.date}</span></div><h3>{article.title}</h3><p>{article.subtitle}</p><span className="card-link">Leggi l’articolo <span aria-hidden="true">→</span></span></Link>)}</div>
    </section>

    <section className="recipe-strip page-gutter section-pad">
      <div className="recipe-strip-copy"><span className="eyebrow">05 — Ricette semplici</span><h2>Buone idee,<br /><em>ingredienti veri.</em></h2><p>Spunti quotidiani da portare a tavola, con il gusto della semplicità.</p><Link className="button button-outline" href="/ricette">Scopri le ricette <span aria-hidden="true">↗</span></Link></div>
      <div className="recipe-mini-list">{recipes.slice(0, 2).map((recipe) => <Link className="recipe-mini" href={`/ricette/${recipe.slug}`} key={recipe.slug}><div className="recipe-mini-image"><Image unoptimized={recipe.image.startsWith("/api/media/") || /^https?:\/\//i.test(recipe.image)} src={recipe.image} alt={recipe.imageAlt} fill sizes="100px" className="cover-image" /></div><div><span className="eyebrow">{recipe.category} · {recipe.prepMinutes} min</span><h3>{recipe.title}</h3><span className="text-link">Apri la ricetta <span aria-hidden="true">→</span></span></div></Link>)}</div>
    </section>

    {featuredStory && <section className="stories-teaser page-gutter section-pad">
      <div className="section-heading-row"><div><span className="eyebrow">06 — Esperienze condivise</span><h2>Un percorso alla<br /><em>volta, con rispetto.</em></h2></div><Link className="text-link" href="/prima-e-dopo">Tutte le storie <span aria-hidden="true">→</span></Link></div>
      <BeforeAfterCard item={featuredStory} />
    </section>}

    <section className="final-cta page-gutter"><div><span className="eyebrow">Un primo passo, con calma</span><h2>Cominciamo<br /><em>da una conversazione.</em></h2></div><div><p>Raccontami cosa stai cercando: ci prendiamo il tempo per capire se il percorso giusto è qui.</p><Link className="button button-light" href="/prenota">Prenota un appuntamento <span aria-hidden="true">↗</span></Link></div><span className="cta-orbit" aria-hidden="true" /></section>
  </>;
}
