import Image from "next/image";
import Link from "next/link";

export type BeforeAfterCardData = {
  title: string;
  slug: string;
  description: string;
  goal: string | null;
  duration: string | null;
  isDemo: boolean;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
};

function previewSource(source: string, preview: boolean) {
  const id = source.match(/^\/api\/media\/([a-z0-9]+)$/i)?.[1];
  return preview && id ? "/api/admin/media/" + id : source;
}

export function BeforeAfterImages({ item, preview = false }: { item: BeforeAfterCardData; preview?: boolean }) {
  const images = [
    { label: "Prima", image: item.before },
    { label: "Dopo", image: item.after },
  ];
  return (
    <div className="story-images" aria-label="Confronto tra le immagini del percorso">
      {images.map(({ label, image }) => (
        <figure className="story-image" key={label}>
          <div className="story-image-frame">
            {image.src
              ? <Image src={previewSource(image.src, preview)} alt={image.alt} fill sizes="(max-width: 700px) 100vw, 40vw" unoptimized loading="lazy" />
              : <div className="story-image-placeholder"><span>Carica un’immagine</span></div>}
          </div>
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function BeforeAfterCard({ item, preview = false }: { item: BeforeAfterCardData; preview?: boolean }) {
  return (
    <article className={"story-card" + (preview ? " story-card-preview" : "")}>
      <div className="story-copy">
        {item.isDemo && <span className="story-demo-label">Esempio dimostrativo · nessuna persona reale</span>}
        <span className="eyebrow">Una storia, senza etichette</span>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        {item.goal && <p><strong>Obiettivo:</strong> {item.goal}</p>}
        {item.duration && <span className="story-duration">Durata: {item.duration}</span>}
        {preview
          ? <span className="text-link story-preview-label">Anteprima privata</span>
          : <Link className="text-link story-detail-link" href={"/prima-e-dopo/" + item.slug}>Scopri il percorso <span aria-hidden="true">→</span></Link>}
      </div>
      <BeforeAfterImages item={item} preview={preview} />
    </article>
  );
}
