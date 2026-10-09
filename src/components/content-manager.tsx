"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { BeforeAfterCard, type BeforeAfterCardData } from "@/components/before-after-card";
import { MediaUrlField } from "@/components/media-url-field";
import { HelpTooltip } from "@/components/help-tooltip";

type ConsentRecordView = {
  scope: "CONTENT" | "IMAGES";
  granted: boolean;
  recordedAt: string;
  withdrawnAt: string | null;
  notes: string | null;
};
type ContentItem = {
  id: string;
  title: string;
  slug?: string;
  published?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isDemo?: boolean;
  updatedAt: string;
  category?: { name: string } | null;
  tags?: { name: string }[];
  coverMedia?: { id: string; altText: string } | null;
  mediaAsset?: { id: string; altText: string } | null;
  beforeMedia?: { id: string; altText: string; url: string; mimeType: string; sizeBytes: number } | null;
  afterMedia?: { id: string; altText: string; url: string; mimeType: string; sizeBytes: number } | null;
  consentRecords?: ConsentRecordView[];
  subtitle?: string | null;
  content?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverImage?: string | null;
  coverAlt?: string | null;
  author?: string;
  socialImage?: string | null;
  description?: string;
  prepMinutes?: number | null;
  difficulty?: string | null;
  ingredients?: string[];
  method?: string[];
  image?: string | null;
  imageAlt?: string | null;
  goal?: string | null;
  journey?: string | null;
  duration?: string | null;
  resultDescription?: string | null;
  testimonial?: string | null;
  imageBefore?: string | null;
  imageAfter?: string | null;
  imageBeforeAlt?: string | null;
  imageAfterAlt?: string | null;
  contentConsent?: boolean;
  imagesConsent?: boolean;
  anonymized?: boolean;
};
type Kind = "articles" | "recipes" | "cases";

const caseStatuses = { DRAFT: "Bozza", PUBLISHED: "Pubblicata", ARCHIVED: "Archiviata" } as const;

export function ContentManager() {
  const [kind, setKind] = useState<Kind>("articles");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [formRevision, setFormRevision] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<BeforeAfterCardData | null>(null);

  const load = useCallback(async (selected: Kind = kind) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/${selected}`);
      const data = await response.json() as ContentItem[] | { error?: string };
      if (!response.ok || !Array.isArray(data)) throw new Error((data as { error?: string }).error ?? "Caricamento non riuscito.");
      setItems(data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Errore nel caricamento."); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(kind); }, 0); return () => window.clearTimeout(timer); }, [kind, load]);

  async function remove(item: ContentItem) {
    if (!window.confirm(`Eliminare “${item.title}” e i consensi associati?`)) return;
    const response = await fetch(`/api/admin/${kind}?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setMessage(result.error ?? "Operazione non riuscita."); return; }
    if (editing?.id === item.id) setEditing(null);
    setPreview(null);
    setMessage("Contenuto eliminato."); await load();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const published = data.get("published") === "on";
    const tags = String(data.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
    let payload: Record<string, unknown>;
    if (kind === "articles") payload = { id: editing?.id, title: data.get("title"), slug: data.get("slug"), subtitle: data.get("subtitle"), category: data.get("category"), tags, content: data.get("content"), author: data.get("author"), published, seoTitle: data.get("seoTitle"), seoDescription: data.get("seoDescription"), socialImage: data.get("socialImage") || undefined, coverImage: data.get("coverImage"), coverAlt: data.get("coverAlt") };
    else if (kind === "recipes") payload = { id: editing?.id, title: data.get("title"), slug: data.get("slug"), description: data.get("description"), category: data.get("category"), tags, prepMinutes: Number(data.get("prepMinutes")) || undefined, difficulty: data.get("difficulty"), ingredients: String(data.get("ingredients")).split("\n").map((line) => line.trim()).filter(Boolean), method: String(data.get("method")).split("\n").map((line) => line.trim()).filter(Boolean), image: data.get("image"), imageAlt: data.get("imageAlt"), published };
    else payload = {
      id: editing?.id,
      title: data.get("title"),
      slug: data.get("slug"),
      description: data.get("description"),
      goal: data.get("goal"),
      journey: data.get("journey"),
      duration: data.get("duration"),
      resultDescription: data.get("resultDescription"),
      testimonial: data.get("testimonial"),
      imageBefore: data.get("imageBefore"),
      imageAfter: data.get("imageAfter"),
      imageBeforeAlt: data.get("imageBeforeAlt"),
      imageAfterAlt: data.get("imageAfterAlt"),
      contentConsent: data.get("contentConsent") === "on",
      imagesConsent: data.get("imagesConsent") === "on",
      contentConsentNotes: data.get("contentConsentNotes"),
      imagesConsentNotes: data.get("imagesConsentNotes"),
      anonymized: data.get("anonymized") === "on",
      status: data.get("status"),
    };
    const response = await fetch(`/api/admin/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string; status?: string; statusChangedByWithdrawal?: boolean };
    if (!response.ok) { setMessage(result.error ?? "Salvataggio non riuscito."); return; }
    form.reset(); setEditing(null); setPreview(null); setFormRevision((current) => current + 1);
    setMessage(result.statusChangedByWithdrawal
      ? "Consenso o requisito ritirato: la storia è stata rimossa dal sito e salvata come bozza."
      : kind === "cases"
        ? result.status === "PUBLISHED" ? "Storia pubblicata." : result.status === "ARCHIVED" ? "Storia archiviata." : "Bozza salvata."
        : published ? "Contenuto pubblicato." : "Bozza salvata.");
    await load();
  }

  function openPreview(form: HTMLFormElement) {
    const data = new FormData(form);
    const read = (name: string) => String(data.get(name) ?? "");
    setPreview({
      title: read("title") || "Titolo del percorso",
      slug: read("slug") || "anteprima",
      description: read("description") || "La descrizione del percorso comparirà qui.",
      goal: read("goal") || null,
      duration: read("duration") || null,
      isDemo: editing?.isDemo ?? false,
      before: { src: read("imageBefore"), alt: read("imageBeforeAlt") || "Immagine prima del percorso" },
      after: { src: read("imageAfter"), alt: read("imageAfterAlt") || "Immagine dopo il percorso" },
    });
  }

  function selectKind(selected: Kind) { setKind(selected); setEditing(null); setPreview(null); setMessage(""); }
  const categoryDefault = editing?.category?.name ?? "";

  return <div className="content-manager">
    <div className="content-tabs" role="tablist" aria-label="Tipo di contenuto">{([ ["articles", "News"], ["recipes", "Ricette"], ["cases", "Storie di percorso"] ] as [Kind, string][]).map(([id, label]) => <button type="button" role="tab" aria-selected={kind === id} className={kind === id ? "active" : ""} key={id} onClick={() => selectKind(id)}>{label}</button>)}</div>
    {message && <p className="admin-message" role="status">{message}</p>}
    <div className="content-columns">
      <section className="content-items" aria-labelledby="saved-content-title">
        <h2 id="saved-content-title">Contenuti salvati</h2>
        {loading ? <p>Caricamento…</p> : items.length ? items.map((item) => {
          const itemStatus = kind === "cases" ? caseStatuses[item.status ?? "DRAFT"] : item.published ? "Pubblicato" : "Bozza";
          return <article className="content-item" key={item.id}><div><strong>{item.title}</strong><small>{item.slug ?? item.category?.name ?? "Senza categoria"} · {itemStatus}{item.isDemo ? " · demo locale" : ""}</small><div className="content-item-actions"><button className="text-button" type="button" onClick={() => { setEditing(item); setPreview(null); setMessage(""); }}>Modifica</button><button className="text-button" type="button" onClick={() => void remove(item)}>Elimina</button></div></div></article>;
        }) : <p className="muted-copy">Nessun contenuto ancora. Puoi crearne uno dal modulo.</p>}
      </section>
      <form className="admin-content-form" onSubmit={save} key={`${kind}-${editing?.id ?? "new"}-${formRevision}`}>
        <h2>{editing ? "Modifica contenuto" : kind === "articles" ? "Nuovo articolo" : kind === "recipes" ? "Nuova ricetta" : "Nuova storia"}</h2>
        <label>Titolo<input name="title" required minLength={3} maxLength={180} defaultValue={editing?.title ?? ""} /></label>
        <label>
          <span className="label-text">
            Slug URL
            <HelpTooltip label="Slug URL" title="Indirizzo URL della pagina" text="Identificativo web per l'indirizzo della pagina (es. /news/tuo-slug). Usa lettere minuscole e trattini, senza spazi né accenti. Non inserire nomi o dati personali. Se modificato dopo la pubblicazione, i vecchi link salvati potrebbero non funzionare più." />
          </span>
          <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} defaultValue={editing?.slug ?? ""} placeholder="un-percorso-senza-dati-identificativi" />
          <span className="field-optional">Non inserire nomi o altri dati personali nel titolo o nello slug.</span>
        </label>
        {kind === "articles" && <>
          <div className="form-row">
            <label>Autore<input name="author" maxLength={120} defaultValue={editing?.author ?? "Valeria Barra"} /></label>
            <label>
              <span className="label-text">
                Sottotitolo
                <HelpTooltip label="Sottotitolo" title="Sottotitolo dell'articolo" text="Testo introduttivo visualizzato subito sotto il titolo principale nella pagina dell'articolo. Aiuta il lettore a comprendere a colpo d'occhio il tema trattato." />
              </span>
              <input name="subtitle" maxLength={240} defaultValue={editing?.subtitle ?? ""} />
            </label>
          </div>
          <div className="form-row">
            <label>
              <span className="label-text">
                Categoria
                <HelpTooltip label="Categoria" title="Categoria tematica" text="Sezione principale a cui appartiene l'articolo (es. 'Approfondimenti', 'Consigli pratici'). Usata per raggruppare i contenuti nella pagina News." />
              </span>
              <input name="category" maxLength={80} defaultValue={categoryDefault} placeholder="Approfondimenti" />
            </label>
            <label>
              <span className="label-text">
                Tag <span className="field-optional">(separati da virgola)</span>
                <HelpTooltip label="Tag" title="Tag dell'articolo" text="Parole chiave tematiche separate da virgola (es. digestione, sport, colazione) che aiutano a catalogare l'articolo e arricchire la navigazione." />
              </span>
              <input name="tags" defaultValue={editing?.tags?.map((tag) => tag.name).join(", ") ?? ""} />
            </label>
          </div>
          <label>
            <span className="label-text">
              Testo <span className="field-optional">(paragrafi separati da una riga vuota)</span>
              <HelpTooltip label="Testo articolo" title="Formattazione del testo" text="Corpo dell'articolo. Per creare un nuovo paragrafo lascia una riga vuota tra un blocco di testo e l'altro." />
            </span>
            <textarea name="content" required minLength={20} rows={8} defaultValue={editing?.content ?? ""} />
          </label>
          <div className="form-row">
            <MediaUrlField name="coverImage" label="Immagine di copertina" initial={editing?.coverImage ?? (editing?.coverMedia ? "/api/media/" + editing.coverMedia.id : "")} altFieldName="coverAlt" />
            <label>
              <span className="label-text">
                Testo alternativo
                <HelpTooltip label="Testo alternativo" title="Testo alternativo (Accessibilità)" text="Descrizione dell'immagine per chi utilizza screen reader o per i motori di ricerca. Spiega brevemente cosa mostra la foto (es. 'Tavola con cibi freschi e verdure di stagione'). Obbligatorio prima del caricamento." />
              </span>
              <input name="coverAlt" maxLength={300} defaultValue={editing?.coverMedia?.altText ?? editing?.coverAlt ?? ""} />
            </label>
          </div>
          <label>
            <span className="label-text">
              Immagine social URL
              <HelpTooltip label="Immagine social URL" title="Immagine di condivisione social" text="Immagine Open Graph utilizzata come anteprima quando condividi l'articolo su WhatsApp, Facebook o altri social. Se lasciata vuota, viene usata la copertina dell'articolo o quella predefinita del sito." />
            </span>
            <input name="socialImage" maxLength={500} defaultValue={editing?.socialImage ?? ""} placeholder="https://…" />
          </label>
          <label>
            <span className="label-text">
              SEO title
              <HelpTooltip label="SEO title" title="Titolo SEO per motori di ricerca" text="Titolo visualizzato da Google nei risultati di ricerca. Se lasciato vuoto, viene utilizzato automaticamente il titolo dell'articolo seguito dal nome dello studio." />
            </span>
            <input name="seoTitle" maxLength={180} defaultValue={editing?.seoTitle ?? ""} />
          </label>
          <label>
            <span className="label-text">
              SEO description
              <HelpTooltip label="SEO description" title="Descrizione per motori di ricerca" text="Breve riassunto di 1–2 frasi (ideale 140–160 caratteri) mostrato sotto il titolo nei risultati di Google. Sintetizza l'argomento per invogliare alla lettura." />
            </span>
            <textarea name="seoDescription" maxLength={320} rows={2} defaultValue={editing?.seoDescription ?? ""} />
          </label>
        </>}
        {kind === "recipes" && <>
          <label>Descrizione<textarea name="description" required minLength={10} maxLength={500} rows={3} defaultValue={editing?.description ?? ""} /></label>
          <div className="form-row">
            <label>
              <span className="label-text">
                Categoria
                <HelpTooltip label="Categoria" title="Categoria della ricetta" text="Tipologia di preparazione (es. 'Primi piatti', 'Spuntini', 'Secondi leggeri'). Organizza le ricette nel ricettario pubblico." />
              </span>
              <input name="category" maxLength={80} defaultValue={categoryDefault} />
            </label>
            <label>
              <span className="label-text">
                Tag <span className="field-optional">(virgole)</span>
                <HelpTooltip label="Tag" title="Tag della ricetta" text="Parole chiave tematiche separate da virgola (es. vegetariano, veloce, senza glutine)." />
              </span>
              <input name="tags" defaultValue={editing?.tags?.map((tag) => tag.name).join(", ") ?? ""} />
            </label>
          </div>
          <div className="form-row">
            <label>
              <span className="label-text">
                Tempo (min)
                <HelpTooltip label="Tempo di preparazione" title="Tempo di preparazione stimato" text="Stima in minuti del tempo necessario per preparare la ricetta (es. 25). Compare nella scheda pubblica con l'icona dell'orologio per orientare il paziente." />
              </span>
              <input name="prepMinutes" type="number" min={1} max={600} defaultValue={editing?.prepMinutes ?? ""} />
            </label>
            <label>
              <span className="label-text">
                Difficoltà
                <HelpTooltip label="Difficoltà" title="Grado di difficoltà" text="Livello di impegno richiesto per la preparazione (es. 'Facile', 'Media', 'Impegnativa'). Aiuta le persone a scegliere le ricette più adatte alle proprie abitudini." />
              </span>
              <input name="difficulty" defaultValue={editing?.difficulty ?? "Facile"} />
            </label>
          </div>
          <label>Ingredienti <span className="field-optional">(uno per riga)</span><textarea name="ingredients" rows={5} required defaultValue={editing?.ingredients?.join("\n") ?? ""} /></label>
          <label>Procedimento <span className="field-optional">(un passaggio per riga)</span><textarea name="method" rows={6} required defaultValue={editing?.method?.join("\n") ?? ""} /></label>
          <div className="form-row">
            <MediaUrlField name="image" label="Immagine ricetta" initial={editing?.image ?? (editing?.mediaAsset ? "/api/media/" + editing.mediaAsset.id : "")} altFieldName="imageAlt" />
            <label>
              <span className="label-text">
                Testo alternativo
                <HelpTooltip label="Testo alternativo" title="Testo alternativo ricetta" text="Descrizione dell'immagine per non vedenti (screen reader) e motori di ricerca. Descrivi in poche parole il piatto preparato (es. 'Ciotola di porridge d'avena con frutti di bosco')." />
              </span>
              <input name="imageAlt" maxLength={300} defaultValue={editing?.mediaAsset?.altText ?? editing?.imageAlt ?? ""} />
            </label>
          </div>
          <label className="check-row">
            <input name="published" type="checkbox" defaultChecked={editing?.published ?? false} />
            <span className="label-text">
              Pubblica
              <HelpTooltip label="Pubblica ricetta" title="Stato di pubblicazione" text="Se attivo, la ricetta diventa immediatamente visibile nell'area Ricette del sito pubblico. Se disattivo, viene conservata come bozza privata." />
            </span>
          </label>
        </>}
        {kind === "cases" && <>
          <p className="privacy-reminder">Non inserire nomi, volti o dettagli che possano identificare la persona. La pubblicazione richiede consensi documentati e la conferma di anonimizzazione. Le note sui consensi restano private nell’area admin.</p>
          {editing?.isDemo && <p className="story-demo-admin-note">Fixture dimostrativa locale: non rappresenta una persona né un consenso reale e non viene inserita nei seed di produzione.</p>}
          <label>Descrizione<textarea name="description" required minLength={10} maxLength={3000} rows={4} defaultValue={editing?.description ?? ""} /></label>
          <label>
            <span className="label-text">
              Obiettivo generale <span className="field-optional">(richiesto per pubblicare)</span>
              <HelpTooltip label="Obiettivo generale" title="Obiettivo del percorso" text="Traguardo nutrizionale concordato con la persona (es. 'Riequilibrio metabolico ed energia quotidiana'). È un requisito obbligatorio per consentire la pubblicazione della storia." />
            </span>
            <textarea name="goal" maxLength={500} rows={2} defaultValue={editing?.goal ?? ""} />
          </label>
          <label>Percorso<textarea name="journey" maxLength={3000} rows={4} defaultValue={editing?.journey ?? ""} /></label>
          <label>
            <span className="label-text">
              Durata
              <HelpTooltip label="Durata" title="Durata complessiva del percorso" text="Tempo complessivo del percorso svolto (es. '6 mesi', '1 anno'). Fornisce una contestualizzazione realistica dei tempi biologici necessari." />
            </span>
            <input name="duration" maxLength={80} defaultValue={editing?.duration ?? ""} />
          </label>
          <label>
            <span className="label-text">
              Risultato descritto
              <HelpTooltip label="Risultato descritto" title="Descrizione dei risultati" text="Descrizione qualitativa del traguardo raggiunto e delle abitudini migliorate. Evita dati clinici strettamente riservati e concentrati sul benessere complessivo." />
            </span>
            <textarea name="resultDescription" maxLength={2000} rows={3} defaultValue={editing?.resultDescription ?? ""} />
          </label>
          <label>
            <span className="label-text">
              Testimonianza <span className="field-optional">(solo se autorizzata e anonimizzata)</span>
              <HelpTooltip label="Testimonianza" title="Testimonianza della persona" text="Parole o riflessioni condivise dalla paziente sul proprio percorso. Può essere inserita solo se espressamente autorizzata nel consenso informato e deve essere rigorosamente priva di nomi o dettagli riconoscibili." />
            </span>
            <textarea name="testimonial" maxLength={2000} rows={3} defaultValue={editing?.testimonial ?? ""} />
          </label>
          <div className="form-row">
            <MediaUrlField name="imageBefore" label="Immagine prima" initial={editing?.imageBefore ?? (editing?.beforeMedia ? "/api/media/" + editing.beforeMedia.id : "")} altFieldName="imageBeforeAlt" allowUrl={false} />
            <label>
              <span className="label-text">
                Testo alternativo prima
                <HelpTooltip label="Testo alternativo prima" title="Testo alternativo prima" text="Descrizione accessibile della prima immagine (es. 'Postura prima dell'inizio del percorso')." />
              </span>
              <input name="imageBeforeAlt" maxLength={300} defaultValue={editing?.beforeMedia?.altText ?? editing?.imageBeforeAlt ?? ""} />
            </label>
          </div>
          <div className="form-row">
            <MediaUrlField name="imageAfter" label="Immagine dopo" initial={editing?.imageAfter ?? (editing?.afterMedia ? "/api/media/" + editing.afterMedia.id : "")} altFieldName="imageAfterAlt" allowUrl={false} />
            <label>
              <span className="label-text">
                Testo alternativo dopo
                <HelpTooltip label="Testo alternativo dopo" title="Testo alternativo dopo" text="Descrizione accessibile della seconda immagine (es. 'Postura al termine del percorso nutrizionale')." />
              </span>
              <input name="imageAfterAlt" maxLength={300} defaultValue={editing?.afterMedia?.altText ?? editing?.imageAfterAlt ?? ""} />
            </label>
          </div>
          <label className="check-row">
            <input type="checkbox" name="contentConsent" defaultChecked={editing?.contentConsent ?? false} />
            <span className="label-text">
              Consenso esplicito alla pubblicazione del racconto.
              <HelpTooltip label="Consenso racconto" title="Consenso informato al racconto" text="Certifica di aver acquisito e conservato in studio il consenso informato scritto e firmato dalla persona per la diffusione anonima della sua storia. Senza questo consenso, il sistema impedisce la pubblicazione." />
            </span>
          </label>
          <label>
            <span className="label-text">
              Nota privata sul consenso al racconto
              <HelpTooltip label="Nota consenso racconto" title="Nota interna di tracciabilità" text="Riferimento interno per il tuo archivio (es. 'Modulo n. 14/2024 firmato in sede'). Rimane visibile solo nell'area admin e assicura la conformità alle verifiche GDPR." />
            </span>
            <textarea name="contentConsentNotes" maxLength={1000} rows={2} placeholder="Es. modulo originale firmato conservato nello studio; non inserire nomi o dati sanitari." />
          </label>
          <label className="check-row">
            <input type="checkbox" name="imagesConsent" defaultChecked={editing?.imagesConsent ?? false} />
            <span className="label-text">
              Consenso esplicito alla pubblicazione di entrambe le immagini.
              <HelpTooltip label="Consenso immagini" title="Consenso alle fotografie" text="Certifica l'autorizzazione specifica e documentata all'utilizzo delle fotografie prima/dopo. Le immagini non devono mostrare volti, tatuaggi o segni che rendano identificabile la persona." />
            </span>
          </label>
          <label>
            <span className="label-text">
              Nota privata sul consenso alle immagini
              <HelpTooltip label="Nota consenso immagini" title="Nota interna archivio foto" text="Riferimento al documento di autorizzazione fotografica conservato in studio. Visibile solo nel pannello admin." />
            </span>
            <textarea name="imagesConsentNotes" maxLength={1000} rows={2} placeholder="Riferimento alla prova conservata nello studio, senza dati identificativi." />
          </label>
          <label className="check-row">
            <input type="checkbox" name="anonymized" defaultChecked={editing?.anonymized ?? false} />
            <span className="label-text">
              Confermo di aver rimosso dati identificativi e informazioni personali non necessarie.
              <HelpTooltip label="Attestazione anonimizzazione" title="Attestazione di anonimizzazione" text="Dichiarazione obbligatoria che certifica l'assenza di nomi reali, dati identificativi o dettagli personali nel testo e nelle immagini. Indispensabile per la tutela della riservatezza sanitaria." />
            </span>
          </label>
          {editing?.consentRecords?.length ? <section className="consent-history" aria-labelledby="consent-history-title"><span className="eyebrow">Registro privato</span><h3 id="consent-history-title">Cronologia dei consensi</h3><ul>{editing.consentRecords.map((record, index) => <li key={record.scope + record.recordedAt + index}><strong>{record.scope === "CONTENT" ? "Racconto" : "Immagini"} · {record.granted && !record.withdrawnAt ? "concesso" : "ritirato"}</strong><time dateTime={record.recordedAt}>{new Date(record.recordedAt).toLocaleString("it-IT")}</time>{record.notes && <span>{record.notes}</span>}</li>)}</ul></section> : null}
          <label>
            <span className="label-text">
              Stato
              <HelpTooltip label="Stato storia" title="Stato del caso clinico" text="Bozza: visibile solo a te per completare la stesura. Pubblicata: visibile sul sito pubblico (richiede tutti i consensi e requisiti verificati). Archiviata: nascosta dal sito pubblico ma conservata nel tuo registro privato." />
            </span>
            <select name="status" defaultValue={editing?.status ?? "DRAFT"}><option value="DRAFT">Bozza · non visibile</option><option value="PUBLISHED">Pubblicata</option><option value="ARCHIVED">Archiviata · non visibile</option></select>
          </label>
          <button className="button button-quiet" type="button" onClick={(event) => openPreview(event.currentTarget.form!)}>Anteprima privata</button>
          {preview && <section className="admin-story-preview" aria-label="Anteprima privata"><div><strong>Anteprima privata · non pubblica</strong><button type="button" className="text-button" onClick={(event) => { const form = event.currentTarget.form; if (form) openPreview(form); }}>Aggiorna anteprima</button></div><BeforeAfterCard item={preview} preview /></section>}
        </>}
        {kind === "articles" && null}
        {kind !== "cases" && kind !== "recipes" && (
          <label className="check-row">
            <input name="published" type="checkbox" defaultChecked={editing?.published ?? false} />
            <span className="label-text">
              Pubblica
              <HelpTooltip label="Pubblica articolo" title="Stato di pubblicazione" text="Se selezionato, l'articolo diventa immediatamente visibile sul sito pubblico a tutti gli utenti. Se deselezionato, resta salvato come bozza privata accessibile solo da questo pannello." />
            </span>
          </label>
        )}
        <div className="form-row"><button className="button" type="submit">{editing ? "Salva modifiche" : "Salva"} <span aria-hidden="true">↗</span></button>{editing && <button className="button button-quiet" type="button" onClick={() => { setEditing(null); setPreview(null); }}>Annulla</button>}</div>
      </form>
    </div>
  </div>;
}
