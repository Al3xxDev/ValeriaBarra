import { BookingForm } from "@/components/booking-form";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Prenota un appuntamento", description: "Invia una richiesta di appuntamento con Valeria Barra, biologa nutrizionista a Salerno.", alternates: { canonical: "/prenota" } };
export default function BookingPage() {
  return <div className="page-shell"><section className="booking-page page-gutter"><div className="booking-intro"><span className="eyebrow">Il primo passo</span><h1>Parliamone<br /><em>con calma.</em></h1><p>Compila il modulo: ti ricontatterò per ascoltare cosa cerchi e concordare insieme il momento più adatto.</p><div className="booking-contact-note"><span className="eyebrow">Valeria Barra</span><span>Biologa Nutrizionista</span><span>Salerno, Italia</span></div><p className="privacy-small">Nel modulo non inserire informazioni sanitarie. Ci sarà tempo per parlarne insieme, in uno spazio adeguato.</p></div><div className="booking-form-wrap"><span className="form-step eyebrow"><span>01</span> Richiesta appuntamento</span><BookingForm /></div></section></div>;
}
