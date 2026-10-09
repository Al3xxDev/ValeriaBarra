"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type FormStatus = { kind: "idle" | "loading" | "success" | "error"; message?: string };

export function BookingForm() {
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "loading") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.privacyAccepted = data.get("privacyAccepted") === "on" ? "true" : "false";
    payload.marketingAccepted = data.get("marketingAccepted") === "on" ? "true" : "false";
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, privacyAccepted: payload.privacyAccepted === "true", marketingAccepted: payload.marketingAccepted === "true" }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Invio non riuscito. Riprova.");
      form.reset();
      setStatus({ kind: "success", message: "Richiesta ricevuta. Ti ricontatterò per concordare insieme data e orario." });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Si è verificato un errore. Riprova tra poco." });
    }
  }

  return (
    <form className="booking-form" onSubmit={submit} aria-describedby="form-status">
      <div className="form-row"><label>Nome<input name="firstName" required minLength={2} maxLength={80} autoComplete="given-name" /></label><label>Cognome<input name="lastName" required minLength={2} maxLength={80} autoComplete="family-name" /></label></div>
      <div className="form-row"><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label>Telefono<input name="phone" type="tel" required minLength={6} maxLength={40} autoComplete="tel" /></label></div>
      <label>Per cosa ti piacerebbe incontrarci?
        <select name="appointmentType" required defaultValue=""><option value="" disabled>Seleziona un appuntamento</option><option>Prima visita</option><option>Controllo</option><option>Colloquio conoscitivo</option></select>
      </label>
      <div className="form-row"><label>Giorno preferito <span className="field-optional">(facoltativo)</span><input name="preferredDay" type="date" min={new Date().toISOString().slice(0, 10)} /></label><label>Fascia oraria <span className="field-optional">(facoltativa)</span><select name="preferredTime" defaultValue=""><option value="">Indifferente</option><option>Mattina</option><option>Pomeriggio</option><option>Indifferente</option></select></label></div>
      <label>Un messaggio <span className="field-optional">(facoltativo, senza informazioni sanitarie)</span><textarea name="message" rows={3} maxLength={1200} placeholder="Dimmi solo ciò che ti serve per organizzare il primo contatto." /></label>
      <label className="check-row"><input name="privacyAccepted" type="checkbox" required /><span>Ho letto l’<Link href="/privacy" target="_blank">informativa privacy</Link> e acconsento al trattamento dei dati necessari per ricontattarmi.</span></label>
      <label className="check-row"><input name="marketingAccepted" type="checkbox" /><span>Desidero ricevere aggiornamenti e novità. Potrò revocare il consenso in ogni momento.</span></label>
      <label className="honeypot" aria-hidden="true">Lascia vuoto<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="form-submit"><button className="button" type="submit" disabled={status.kind === "loading"}>{status.kind === "loading" ? "Invio in corso…" : "Invia la richiesta"}<span aria-hidden="true">↗</span></button><span>Ti ricontatterò per confermare l’appuntamento.</span></div>
      <p id="form-status" role="status" aria-live="polite" className={`form-status ${status.kind}`}>{status.message}</p>
    </form>
  );
}
