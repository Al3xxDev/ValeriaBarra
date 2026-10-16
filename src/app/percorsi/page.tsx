import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Percorsi nutrizionali",
  description: "Scopri i percorsi di consulenza nutrizionale personalizzati a Salerno con la Dott.ssa Valeria Barra.",
  alternates: { canonical: "/percorsi" },
};

const services = [
  {
    id: "prima-visita",
    no: "01",
    title: "Prima visita",
    intro: "Un primo incontro dedicato all’ascolto della tua storia, per comprendere bisogni, abitudini e traguardi.",
    includes: [
      "Colloquio approfondito su stile di vita e abitudini quotidiane",
      "Valutazione globale della salute e attenzione al rapporto tra alimentazione, integrazione e farmaci",
      {
        title: "Valutazione della composizione corporea",
        subitems: [
          {
            title: "Misure antropometriche e plicometria",
            text: "Rilevazione di peso, altezza e circonferenze corporee, integrata dalla misurazione delle pliche cutanee per stimare la quantità e la distribuzione del grasso sottocutaneo.",
          },
          {
            title: "Bioimpedenziometria (BIA)",
            text: "Esame rapido e non invasivo che consente di valutare lo stato di idratazione e la distribuzione dei liquidi corporei, attraverso la stima dell’acqua intra ed extracellulare.",
          },
          {
            title: "Cosa valutiamo insieme",
            text: "L’integrazione dei dati ottenuti tramite BIA e plicometria permette di stimare la composizione corporea, distinguendo la componente magra da quella grassa. Queste informazioni aiutano a monitorare l’andamento del percorso nutrizionale, valutando i cambiamenti nel tempo e orientando le strategie alimentari verso una riduzione della massa grassa con attenzione alla preservazione della massa muscolare.",
          },
        ],
      },
      "Indicazioni nutrizionali chiare, sicure e adattate alla vita reale",
      "Spazio dedicato per condividere dubbi e chiarimenti",
    ],
  },
  {
    id: "controllo",
    no: "02",
    title: "Controllo",
    intro: "Un momento di confronto periodico per osservare i progressi e adattare il percorso al tuo ritmo.",
    includes: [
      "Verifica dell’andamento e del benessere percepito nella quotidianità",
      "Confronto aperto su esigenze emerse e cambiamenti dello stile di vita",
      "Aggiornamento e affinamento delle indicazioni nutrizionali",
    ],
  },
  {
    id: "educazione",
    no: "03",
    title: "Educazione alimentare",
    intro: "Conoscenze e strumenti pratici per portare maggiore serenità e autonomia nelle scelte quotidiane.",
    includes: [
      "Lettura consapevole delle etichette e organizzazione flessibile dei pasti",
      "Strategie pratiche per la spesa e la cucina di tutti i giorni",
      "Approfondimenti personalizzati sui tuoi ritmi e preferenze",
    ],
  },
];

export default function PathsPage() {
  return (
    <div className="page-shell">
      <section className="page-intro page-gutter">
        <span className="eyebrow">Percorsi e consulenze</span>
        <h1>Il supporto giusto,<br /><em>al tuo ritmo.</em></h1>
        <p>Ogni incontro parte dall’ascolto e si costruisce sul confronto: comprendere i tuoi bisogni, il tuo stile di vita e i traguardi che desideriamo raggiungere insieme.</p>
      </section>

      <section className="path-list page-gutter">
        {services.map((item) => (
          <article id={item.id} className="path-item" key={item.id}>
            <span className="path-number">{item.no}</span>
            <div className="path-main">
              <h2>{item.title}</h2>
              <p>{item.intro}</p>
              <span className="eyebrow">Cosa comprende</span>
              <ul>
                {item.includes.map((line, idx) => {
                  if (typeof line === "string") {
                    return <li key={idx}>{line}</li>;
                  }
                  return (
                    <li key={line.title} className="path-item-nested">
                      <span className="path-nested-title">{line.title}</span>
                      <div className="path-sublist">
                        {line.subitems.map((sub) => (
                          <div key={sub.title} className="path-subitem">
                            <span className="path-subitem-title">{sub.title}</span>
                            <p>{sub.text}</p>
                          </div>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="path-side">
              <p>Durata e modalità vengono concordate insieme in base al tipo di incontro e alle tue esigenze.</p>
              <Link className="text-link" href="/prenota">Chiedi informazioni <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ))}
      </section>

      <section className="note-panel page-gutter">
        <span className="eyebrow">Una nota professionale</span>
        <p>Le consulenze nutrizionali non sostituiscono diagnosi o terapie mediche e non prevedono la prescrizione o la modifica di farmaci. Quando opportuno, il percorso nutrizionale e l’eventuale integrazione si armonizzano con il confronto con il medico curante o gli specialisti di riferimento.</p>
      </section>

      <section className="page-cta page-gutter">
        <h2>Hai qualche domanda<br /><em>prima di iniziare?</em></h2>
        <Link className="button" href="/prenota">Scrivimi per parlarne <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}
