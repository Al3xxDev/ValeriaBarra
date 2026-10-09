"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpTooltip } from "@/components/help-tooltip";

type Booking = { id: string; firstName: string; lastName: string; email: string; phone: string; appointmentType: string; preferredDay: string | null; preferredTime: string | null; message: string | null; internalNotes: string | null; status: string; createdAt: string };
const statuses = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED", "COMPLETED", "ARCHIVED"];
const labels: Record<string, string> = { NEW: "Nuova", CONTACTED: "Contattata", CONFIRMED: "Confermata", CANCELLED: "Annullata", COMPLETED: "Completata", ARCHIVED: "Archiviata" };

export function BookingManager() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("NEW");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [status, setStatus] = useState("NEW");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/bookings", window.location.origin);
      if (query) url.searchParams.set("q", query);
      if (filter !== "ALL") url.searchParams.set("status", filter);
      const response = await fetch(url);
      const data = await response.json() as Booking[] | { error?: string };
      if (!response.ok || !Array.isArray(data)) throw new Error((data as { error?: string }).error ?? "Caricamento non riuscito.");
      setRows(data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Non è stato possibile caricare le prenotazioni."); }
    finally { setLoading(false); }
  }, [query, filter]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 150); return () => window.clearTimeout(timer); }, [load]);

  function open(item: Booking) { setSelected(item); setStatus(item.status); setNotes(item.internalNotes ?? ""); }
  async function save() {
    if (!selected) return;
    const response = await fetch("/api/admin/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, status, internalNotes: notes }) });
    const data = await response.json() as Booking | { error?: string };
    if (!response.ok) { setMessage((data as { error?: string }).error ?? "Modifica non riuscita."); return; }
    setSelected(null); setMessage("Prenotazione aggiornata."); await load();
  }

  return <>
    <div className="admin-toolbar">
      <label className="search-field">
        <span className="sr-only">Cerca prenotazioni</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca nome, email, telefono" />
      </label>
      <div className="filter-field-wrap">
        <label className="filter-field">
          <span className="sr-only">Filtra per stato</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="ALL">Tutti gli stati</option>
            {statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}
          </select>
        </label>
        <HelpTooltip label="Filtro per stato" title="Filtro stato prenotazioni" text="Filtra le richieste in base alla fase di avanzamento: Nuove (da gestire), Contattate, Confermate, Annullate, Completate o Archiviate." />
      </div>
    </div>
    {message && <p className="admin-message" role="status">{message}</p>}
    {loading ? <div className="admin-empty">Caricamento prenotazioni…</div> : rows.length ? <div className="booking-list">{rows.map((item) => <button className="booking-row" key={item.id} onClick={() => open(item)}><span className={`status-dot status-${item.status.toLowerCase()}`} aria-hidden="true" /><span className="booking-person"><strong>{item.firstName} {item.lastName}</strong><small>{item.appointmentType} · {new Date(item.createdAt).toLocaleDateString("it-IT")}</small></span><span className="booking-contact">{item.email}<small>{item.phone}</small></span><span className={`status-pill status-${item.status.toLowerCase()}`}>{labels[item.status]}</span><span aria-hidden="true" className="booking-arrow">↗</span></button>)}</div> : <div className="admin-empty"><strong>Nessuna prenotazione da mostrare.</strong><span>Le nuove richieste appariranno qui.</span></div>}
    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-detail-title"><button className="modal-close" onClick={() => setSelected(null)} aria-label="Chiudi dettagli">×</button><span className="eyebrow">Richiesta del {new Date(selected.createdAt).toLocaleDateString("it-IT")}</span><h2 id="booking-detail-title">{selected.firstName} {selected.lastName}</h2><div className="detail-grid"><span>Email</span><a href={`mailto:${selected.email}`}>{selected.email}</a><span>Telefono</span><a href={`tel:${selected.phone}`}>{selected.phone}</a><span>Appuntamento</span><strong>{selected.appointmentType}</strong><span>Preferenza</span><strong>{selected.preferredDay ? new Date(selected.preferredDay).toLocaleDateString("it-IT") : "Da concordare"} · {selected.preferredTime ?? "Orario libero"}</strong></div>{selected.message && <div className="message-note"><span className="eyebrow">Messaggio</span><p>{selected.message}</p></div>}<label><span className="label-text">Stato<HelpTooltip label="Stato prenotazione" title="Stato della prenotazione" text="Aggiorna la fase del contatto: Nuova (appena ricevuta), Contattata (hai risposto alla paziente), Confermata (visita concordata), Annullata, Completata (visita svolta) o Archiviata." /></span><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label><label><span className="label-text">Note interne<HelpTooltip label="Note interne" title="Note riservate nutrizionista" text="Appunti clinici o organizzativi riservati ad uso esclusivo dello studio (es. preferenze concordate al telefono). Non vengono mai inviati né mostrati alla paziente." /></span><textarea rows={4} maxLength={3000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Visibili solo nell’area amministrativa" /></label><button className="button" onClick={save}>Salva modifiche <span aria-hidden="true">↗</span></button></section></div>}
  </>;
}
