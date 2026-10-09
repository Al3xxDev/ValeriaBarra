import type { Metadata } from "next";
import Link from "next/link";
import { BeforeAfterCard } from "@/components/before-after-card";
import { getPublicBeforeAfterCases } from "@/lib/before-after";
import { toBeforeAfterCardData } from "@/lib/before-after-view";

export const dynamic = "force-dynamic";

const pageTitle = "Storie di percorso";
const pageDescription = "Esperienze condivise con consenso esplicito, rispetto e attenzione alla riservatezza.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/prima-e-dopo" },
  openGraph: { title: pageTitle, description: pageDescription, url: "/prima-e-dopo", type: "website", images: ["/images/tavola-mediterranea-placeholder.png"] },
  robots: { index: true, follow: true },
};

export default async function StoriesPage() {
  let cases: Awaited<ReturnType<typeof getPublicBeforeAfterCases>> = [];
  let unavailable = false;
  try {
    cases = await getPublicBeforeAfterCases();
  } catch (error) {
    unavailable = true;
    if (process.env.NODE_ENV === "production") console.error("Stories unavailable", error instanceof Error ? error.name : "unknown");
  }
  const cards = cases.map(toBeforeAfterCardData);

  return (
    <div className="page-shell">
      <section className="page-intro page-gutter">
        <span className="eyebrow">Esperienze condivise</span>
        <h1>Ogni percorso<br /><em>ha la sua storia.</em></h1>
        <p>Alcuni percorsi nutrizionali raccontati attraverso l’esperienza, con consenso e nel rispetto della riservatezza. Ogni storia è personale e non rappresenta una promessa di risultati.</p>
      </section>
      <section className="stories-list page-gutter" aria-label="Storie di percorso">
        {unavailable
          ? <div className="stories-empty" role="status"><span className="eyebrow">Un momento, per favore</span><h2>Le storie non sono disponibili ora.</h2><p>Riprova tra poco.</p></div>
          : cards.length
            ? cards.map((item) => <BeforeAfterCard item={item} key={item.slug} />)
            : <div className="stories-empty"><span className="eyebrow">Con rispetto, prima di tutto</span><h2>Le storie si condividono<br /><em>solo quando è il momento.</em></h2><p>Presto saranno disponibili nuovi percorsi raccontati attraverso esperienze reali.</p><Link className="text-link" href="/percorsi">Scopri come lavoriamo <span aria-hidden="true">→</span></Link></div>}
      </section>
    </div>
  );
}
