import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chi sono",
  description: "Dott.ssa Valeria Barra, biologa nutrizionista abilitata e laureata in Farmacia a Salerno. Competenze scientifiche, ascolto e percorsi su misura.",
  alternates: { canonical: "/chi-sono" },
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <section className="about-hero page-gutter">
        <div>
          <span className="eyebrow">Dott.ssa Valeria Barra</span>
          <h1>La nutrizione<br /><em>parte dall’ascolto.</em></h1>
          <p>Sono Biologa Nutrizionista abilitata e laureata in Farmacia. Nel mio lavoro fondo le competenze farmacologiche e nutrizionali con l’ascolto della persona, per offrire indicazioni chiare, sicure e adattate alla vita reale.</p>
        </div>
        <figure className="about-image">
          <Image
            src="/images/valeria-studio-placeholder.png"
            alt="Studio professionale di Valeria Barra, Biologa Nutrizionista a Salerno"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 40vw"
            className="cover-image"
          />
        </figure>
      </section>

      <section className="about-story page-gutter section-pad">
        <span className="eyebrow">Il mio percorso</span>
        <div>
          <h2>Salute nella sua totalità,<br /><em>tra rigore scientifico e vita reale.</em></h2>
          <p>La mia esperienza sul campo mi consente di considerare la salute nella sua totalità, prestando un’attenzione rigorosa anche al rapporto tra cibo, integrazione e farmaci.</p>
          <p>Ogni percorso parte da te. Il primo passo è sempre il confronto: comprendere i tuoi bisogni, il tuo stile di vita e i traguardi che desideriamo raggiungere insieme.</p>
        </div>
      </section>

      <section className="values-section page-gutter">
        <article>
          <span>01</span>
          <h3>Competenze integrate</h3>
          <p>Laurea in Farmacia e abilitazione in Nutrizione: competenze scientifiche unite per valutare con equilibrio alimentazione, integrazione e salute complessiva.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Ascolto e confronto</h3>
          <p>Uno spazio accogliente e senza giudizio in cui dialogare apertamente su abitudini, esigenze quotidiane e ritmi di vita.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Traguardi condivisi</h3>
          <p>Indicazioni chiare, pratiche e sostenibili nel tempo, costruite su misura per raggiungere insieme risultati duraturi.</p>
        </article>
      </section>

      <section className="quote-band page-gutter">
        <span className="quote-mark" aria-hidden="true">“</span>
        <blockquote>Eat well, you live better.</blockquote>
        <span className="eyebrow">Dott.ssa Valeria Barra · Biologa Nutrizionista a Salerno</span>
      </section>

      <section className="about-cta page-gutter">
        <p>Se desideri iniziare un percorso costruito intorno a te, possiamo confrontarci insieme.</p>
        <Link className="button" href="/prenota">Fissiamo un primo incontro <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}
