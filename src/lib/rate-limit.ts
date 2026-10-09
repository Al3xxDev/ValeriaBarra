import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function allowRequest(scope: string, value: string, limit: number, windowMs: number) {
  const key = `${scope}:${createHash("sha256").update(value).digest("hex")}`;
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.authThrottle.findUnique({ where: { key } });
      if (existing?.blockedUntil && existing.blockedUntil > now) return false;
      if (!existing || existing.windowStartedAt.getTime() + windowMs < now.getTime()) {
        await tx.authThrottle.upsert({
          where: { key },
          create: { key, attempts: 1, windowStartedAt: now },
          update: { attempts: 1, windowStartedAt: now, blockedUntil: null },
        });
        return true;
      }

      const attempts = existing.attempts + 1;
      await tx.authThrottle.update({
        where: { key },
        data: {
          attempts,
          blockedUntil: attempts >= limit ? new Date(now.getTime() + windowMs) : null,
        },
      });
      return attempts <= limit;
    });
  } catch (error) {
    console.error("Rate limit storage is unavailable", error instanceof Error ? error.name : "unknown");
    return process.env.NODE_ENV !== "production";
  }
}

export async function clearRateLimit(scope: string, value: string) {
  const key = `${scope}:${createHash("sha256").update(value).digest("hex")}`;
  await prisma.authThrottle.deleteMany({ where: { key } });
}
