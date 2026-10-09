import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Richiesta non valida." }, { status: 403 });
  await destroySession();
  return NextResponse.json({ ok: true });
}
