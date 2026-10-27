import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admin-login-flow";
import { clientAddress, isSameOrigin } from "@/lib/request";
import { allowAdminLogin, clearAdminLoginRateLimits } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Richiesta non valida." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dati non validi." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Inserisci email e password validi." }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const result = await authenticateAdmin({
    address: clientAddress(),
    email,
    password: parsed.data.password,
  }, {
    checkRateLimit: allowAdminLogin,
    findAdmin: async (adminEmail) => prisma.adminUser.findUnique({
      where: { email: adminEmail },
      select: { id: true, passwordHash: true },
    }),
    verifyPassword: compare,
    createSession,
    clearRateLimits: clearAdminLoginRateLimits,
  });

  if (result.status === 200) return NextResponse.json({ ok: true });
  if (result.status === 401) return NextResponse.json({ error: "Email o password non corretti." }, { status: 401 });
  if (result.status === 429) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova tra qualche minuto." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } },
    );
  }

  return NextResponse.json({ error: "Accesso temporaneamente non disponibile." }, { status: 503 });
}
