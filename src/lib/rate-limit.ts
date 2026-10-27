import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { advanceRateLimit, getLoginRateLimitKeys } from "@/lib/rate-limit-policy";

export type RateLimitResult =
  | { status: "allowed" }
  | { status: "limited"; retryAfterMs: number }
  | { status: "unavailable" };

function makeKey(scope: string, value: string) {
  return `${scope}:${createHash("sha256").update(value).digest("hex")}`;
}

function logStorageFailure(error: unknown) {
  console.error("Rate limit storage unavailable", error instanceof Error ? error.name : "unknown");
}

type ThrottleTransaction = Prisma.TransactionClient;

async function lockKey(tx: ThrottleTransaction, key: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key})::bigint)`;
}

async function recordAttempt(tx: ThrottleTransaction, key: string, limit: number, windowMs: number, now: number) {
  const existing = await tx.authThrottle.findUnique({ where: { key } });
  const decision = advanceRateLimit(
    existing ? {
      attempts: existing.attempts,
      windowStartedAt: existing.windowStartedAt.getTime(),
      blockedUntil: existing.blockedUntil?.getTime() ?? null,
    } : null,
    now,
    limit,
    windowMs,
  );

  if (decision.shouldPersist) {
    await tx.authThrottle.upsert({
      where: { key },
      create: {
        key,
        attempts: decision.state.attempts,
        windowStartedAt: new Date(decision.state.windowStartedAt),
        blockedUntil: decision.state.blockedUntil === null ? null : new Date(decision.state.blockedUntil),
      },
      update: {
        attempts: decision.state.attempts,
        windowStartedAt: new Date(decision.state.windowStartedAt),
        blockedUntil: decision.state.blockedUntil === null ? null : new Date(decision.state.blockedUntil),
      },
    });
  }

  return decision;
}

function toRateLimitResult(allowed: boolean, retryAfterMs: number): RateLimitResult {
  return allowed ? { status: "allowed" } : { status: "limited", retryAfterMs };
}

export async function allowRequest(
  scope: string,
  value: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const key = makeKey(scope, value);

  try {
    const transition = await prisma.$transaction(async (tx) => {
      // Serialize updates for this key across all Netlify function instances.
      await lockKey(tx, key);
      return recordAttempt(tx, key, limit, windowMs, Date.now());
    });

    return toRateLimitResult(transition.allowed, transition.retryAfterMs);
  } catch (error) {
    logStorageFailure(error);
    return { status: "unavailable" };
  }
}

export async function allowAdminLogin(address: string, email: string): Promise<RateLimitResult> {
  const [ipKey, pairKey] = getLoginRateLimitKeys(address, email);
  const ipStorageKey = makeKey(ipKey.scope, ipKey.value);
  const pairStorageKey = makeKey(pairKey.scope, pairKey.value);

  try {
    const result = await prisma.$transaction(async (tx) => {
      await lockKey(tx, ipStorageKey);
      await lockKey(tx, pairStorageKey);
      const now = Date.now();
      const ipDecision = await recordAttempt(tx, ipStorageKey, ipKey.limit, ipKey.windowMs, now);
      if (!ipDecision.allowed) return ipDecision;
      return recordAttempt(tx, pairStorageKey, pairKey.limit, pairKey.windowMs, now);
    });

    return toRateLimitResult(result.allowed, result.retryAfterMs);
  } catch (error) {
    logStorageFailure(error);
    return { status: "unavailable" };
  }
}

export async function clearRateLimit(scope: string, value: string) {
  const key = makeKey(scope, value);
  try {
    await prisma.$transaction(async (tx) => {
      await lockKey(tx, key);
      await tx.authThrottle.deleteMany({ where: { key } });
    });
    return true;
  } catch (error) {
    logStorageFailure(error);
    return false;
  }
}

export async function clearAdminLoginRateLimits(address: string, email: string) {
  const [ipKey, pairKey] = getLoginRateLimitKeys(address, email);
  const ipStorageKey = makeKey(ipKey.scope, ipKey.value);
  const pairStorageKey = makeKey(pairKey.scope, pairKey.value);
  try {
    await prisma.$transaction(async (tx) => {
      await lockKey(tx, ipStorageKey);
      await lockKey(tx, pairStorageKey);
      await tx.authThrottle.deleteMany({ where: { key: { in: [ipStorageKey, pairStorageKey] } } });
    });
    return true;
  } catch (error) {
    logStorageFailure(error);
    return false;
  }
}
