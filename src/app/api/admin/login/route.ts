import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { clientAddress, isSameOrigin } from "@/lib/request";
import { allowRequest, clearRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Richiesta non valida." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dati non validi." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Inserisci email e password validi." }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const address = clientAddress(request);
  const rateKey = `${address}:${email}`;
  if (!await allowRequest("login", rateKey, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova tra qualche minuto." }, { status: 429 });
  }

  try {
    const user = await prisma.adminUser.findUnique({ where: { email } });
    const valid = user ? await compare(parsed.data.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Email o password non corretti." }, { status: 401 });
    await clearRateLimit("login", rateKey);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin login unavailable", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Accesso temporaneamente non disponibile." }, { status: 503 });
  }
}
