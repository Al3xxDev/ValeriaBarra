import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rate-limit";
import { clientAddress, isSameOrigin } from "@/lib/request";
import { bookingRequestSchema, type BookingRequest } from "@/lib/booking-validation";

async function sendReceipt(data: BookingRequest) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_TO;
  if (!key || !to) return;
  const safeName = `${data.firstName} ${data.lastName}`.replace(/[<>]/g, "");
  const messages = [
    { to, subject: "Nuova richiesta di appuntamento", text: `Richiesta da ${safeName}. Email: ${data.email}. Telefono: ${data.phone}. Tipologia: ${data.appointmentType}.` },
    { to: data.email, subject: "Abbiamo ricevuto la tua richiesta", text: `Ciao ${data.firstName},\n\nho ricevuto la tua richiesta di appuntamento e ti ricontatterò appena possibile per concordare data e orario.\n\nValeria Barra · Biologa Nutrizionista` },
  ];
  for (const message of messages) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Valeria Barra <onboarding@resend.dev>", ...message }),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) console.error("Booking email delivery failed", response.status);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Richiesta non valida." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Controlla i dati inseriti." }, { status: 400 }); }
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Controlla i campi obbligatori e riprova." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  if (!await allowRequest("booking", clientAddress(request), 4, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Hai inviato troppe richieste. Riprova più tardi." }, { status: 429 });
  }

  try {
    const item = parsed.data;
    await prisma.booking.create({ data: {
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email.trim().toLowerCase(),
      phone: item.phone,
      appointmentType: item.appointmentType,
      preferredDay: item.preferredDay ? new Date(`${item.preferredDay}T00:00:00.000Z`) : null,
      preferredTime: item.preferredTime || null,
      message: item.message || null,
      privacyAcceptedAt: new Date(),
      marketingAcceptedAt: item.marketingAccepted ? new Date() : null,
    } });
    try { await sendReceipt(item); } catch (error) { console.error("Booking email provider unavailable", error instanceof Error ? error.name : "unknown"); }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Booking save failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Non è stato possibile inviare la richiesta. Riprova tra poco." }, { status: 503 });
  }
}
