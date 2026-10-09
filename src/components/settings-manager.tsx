"use client";

import { FormEvent, useEffect, useState } from "react";
import { HelpTooltip } from "@/components/help-tooltip";

type Settings = { name: string; qualification: string; shortBio: string; city: string; email: string | null; phone: string | null; whatsapp: string | null; instagram: string | null; facebook: string | null; ctaLabel: string; seoTitle: string | null; seoDescription: string | null };
const defaults: Settings = { name: "Valeria Barra", qualification: "Biologa Nutrizionista", shortBio: "Un percorso nutrizionale costruito intorno alla tua vita, con ascolto e consapevolezza.", city: "Salerno", email: "", phone: "", whatsapp: "", instagram: "", facebook: "", ctaLabel: "Prenota un appuntamento", seoTitle: "", seoDescription: "" };

export function SettingsManager() {
  const [values, setValues] = useState<Settings>(defaults);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/admin/settings").then(async (response) => {
        if (!response.ok) throw new Error("Impostazioni non disponibili. Verifica il collegamento al database.");
        const data = await response.json() as Settings | null;
        if (data) setValues({ ...defaults, ...data });
      }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Caricamento non riuscito."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function update(name: keyof Settings, value: string) { setValues((current) => ({ ...current, [name]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as Settings | { error?: string };
      if (!response.ok) throw new Error((result as { error?: string }).error ?? "Salvataggio non riuscito.");
      setMessage("Impostazioni salvate.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Salvataggio non riuscito."); }
    finally { setPending(false); }
  }

  return <form className="settings-form" onSubmit={submit}>
    <section>
      <span className="eyebrow">Identità</span>
      <div className="form-row">
        <label>
          Nome
          <input value={values.name} onChange={(event) => update("name", event.target.value)} required maxLength={120} />
        </label>
        <label>
          <span className="label-text">
            Qualifica
            <HelpTooltip label="Qualifica" title="Qualifica professionale" text="Titolo professionale mostrato accanto al tuo nome nell'intestazione del sito, nel footer e nei metadati ufficiali. Definisce la figura sanitaria (es. 'Biologa Nutrizionista')." />
          </span>
          <input value={values.qualification} onChange={(event) => update("qualification", event.target.value)} required maxLength={160} />
        </label>
      </div>
      <label>
        <span className="label-text">
          Breve presentazione
          <HelpTooltip label="Breve presentazione" title="Presentazione in Home page" text="Sintesi del tuo approccio visibile nella parte alta della Home (hero) e nel footer. Presenta la tua filosofia nutrizionale e accoglie le persone che visitano il sito." />
        </span>
        <textarea value={values.shortBio} onChange={(event) => update("shortBio", event.target.value)} minLength={20} maxLength={420} rows={3} required />
      </label>
      <label>
        <span className="label-text">
          Città
          <HelpTooltip label="Città" title="Città di riferimento" text="Località principale in cui eserciti la professione (es. 'Salerno'). Viene mostrata nel footer e nei dati di contatto per orientare i pazienti sul territorio." />
        </span>
        <input value={values.city} onChange={(event) => update("city", event.target.value)} required maxLength={100} />
      </label>
      <label>
        <span className="label-text">
          Testo CTA
          <HelpTooltip label="Testo CTA" title="Pulsante di azione principale (CTA)" text="Testo visualizzato sul pulsante principale della Home page che indirizza alla pagina di prenotazione. Puoi personalizzarlo (es. 'Prenota un appuntamento' o 'Inizia il tuo percorso')." />
        </span>
        <input value={values.ctaLabel} onChange={(event) => update("ctaLabel", event.target.value)} required maxLength={60} />
      </label>
    </section>
    <section>
      <span className="eyebrow">Recapiti</span>
      <div className="form-row">
        <label>
          Email
          <input type="email" value={values.email ?? ""} onChange={(event) => update("email", event.target.value)} maxLength={254} />
        </label>
        <label>
          Telefono
          <input type="tel" value={values.phone ?? ""} onChange={(event) => update("phone", event.target.value)} maxLength={40} />
        </label>
      </div>
      <label>
        <span className="label-text">
          WhatsApp
          <HelpTooltip label="WhatsApp" title="Numero WhatsApp" text="Recapito telefonico per le comunicazioni dirette. Se inserito, crea un pulsante cliccabile nel footer che apre direttamente una chat WhatsApp. Inserisci il prefisso internazionale (es. +393401234567)." />
        </span>
        <input type="tel" value={values.whatsapp ?? ""} onChange={(event) => update("whatsapp", event.target.value)} maxLength={40} />
      </label>
    </section>
    <section>
      <span className="eyebrow">Social e SEO</span>
      <div className="form-row">
        <label>
          <span className="label-text">
            Instagram URL
            <HelpTooltip label="Instagram URL" title="Profilo Instagram" text="Link completo alla tua pagina Instagram (es. https://instagram.com/tuoprofilo). Se lasciato vuoto, il collegamento non viene mostrato nel footer del sito." />
          </span>
          <input type="url" value={values.instagram ?? ""} onChange={(event) => update("instagram", event.target.value)} placeholder="https://…" />
        </label>
        <label>
          <span className="label-text">
            Facebook URL
            <HelpTooltip label="Facebook URL" title="Pagina Facebook" text="Indirizzo completo della tua pagina Facebook professionale. Se vuoto, la relativa voce viene nascosta nel footer." />
          </span>
          <input type="url" value={values.facebook ?? ""} onChange={(event) => update("facebook", event.target.value)} placeholder="https://…" />
        </label>
      </div>
      <label>
        <span className="label-text">
          SEO title
          <HelpTooltip label="SEO title" title="Titolo SEO per motori di ricerca" text="Titolo visualizzato da Google nei risultati di ricerca e nella scheda del browser. Se non specificato, il sito utilizza automaticamente 'Valeria Barra — Biologa Nutrizionista Salerno'." />
        </span>
        <input value={values.seoTitle ?? ""} onChange={(event) => update("seoTitle", event.target.value)} maxLength={180} />
      </label>
      <label>
        <span className="label-text">
          SEO description
          <HelpTooltip label="SEO description" title="Descrizione per i motori di ricerca" text="Breve riassunto di 1–2 frasi (ideale 140–160 caratteri) mostrato sotto il titolo nei risultati di Google. Sintetizza chi sei, dove ricevi e quali percorsi nutrizionali offri." />
        </span>
        <textarea value={values.seoDescription ?? ""} onChange={(event) => update("seoDescription", event.target.value)} maxLength={320} rows={2} />
      </label>
    </section>
    <div className="settings-submit"><button className="button" disabled={pending}>{pending ? "Salvataggio…" : "Salva impostazioni"} <span aria-hidden="true">↗</span></button>{message && <p role="status" className="admin-message">{message}</p>}</div>
  </form>;
}
