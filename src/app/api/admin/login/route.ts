import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admin-login-flow";
import { clientAddress, isSameOrigin, requestCorrelationId } from "@/lib/request";
import { allowAdminLogin, clearAdminLoginRateLimits } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getAdminRuntimeConfigIssues } from "@/lib/admin-runtime-config";

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

function jsonResponse(payload: Record<string, unknown>, status: number, requestId: string, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("x-request-id", requestId);
  return NextResponse.json({ ...payload, requestId }, { status, headers: responseHeaders });
}

export async function POST(request: Request) {
  const requestId = requestCorrelationId();
  if (!isSameOrigin(request)) return jsonResponse({ error: "Richiesta non valida." }, 403, requestId);
  let body: unknown;
  try { body = await request.json(); } catch { return jsonResponse({ error: "Dati non validi." }, 400, requestId); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: "Inserisci email e password validi." }, 400, requestId);

  const email = parsed.data.email.trim().toLowerCase();
  const result = await authenticateAdmin({
    address: clientAddress(),
    email,
    password: parsed.data.password,
    requestId,
  }, {
    configurationIssues: () => getAdminRuntimeConfigIssues(),
    checkRateLimit: allowAdminLogin,
    findAdmin: async (adminEmail) => prisma.adminUser.findUnique({
      where: { email: adminEmail },
      select: { id: true, passwordHash: true },
    }),
    verifyPassword: compare,
    createSession,
    clearRateLimits: (address, adminEmail) => clearAdminLoginRateLimits(address, adminEmail, requestId),
  });

  if (result.status === 200) return jsonResponse({ ok: true }, 200, requestId);
  if (result.status === 401) return jsonResponse({ error: "Email o password non corretti." }, 401, requestId);
  if (result.status === 429) {
    return jsonResponse(
      { error: "Troppi tentativi. Riprova tra qualche minuto." },
      429,
      requestId,
      { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) },
    );
  }

  return jsonResponse({ error: "Accesso temporaneamente non disponibile." }, 503, requestId);
}
