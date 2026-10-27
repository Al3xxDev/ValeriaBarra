import type { RateLimitResult } from "@/lib/rate-limit";

export type LoginAdminRecord = { id: string; passwordHash: string };
export type AdminLoginResult =
  | { status: 200 }
  | { status: 401 }
  | { status: 429; retryAfterMs: number }
  | { status: 503 };

export type AdminLoginDependencies = {
  checkRateLimit(address: string, email: string): Promise<RateLimitResult>;
  findAdmin(email: string): Promise<LoginAdminRecord | null>;
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  createSession(userId: string): Promise<void>;
  clearRateLimits(address: string, email: string): Promise<boolean>;
};

function logFailure(label: string, error: unknown) {
  console.error(label, error instanceof Error ? error.name : "unknown");
}

export async function authenticateAdmin(
  input: { address: string | null; email: string; password: string },
  dependencies: AdminLoginDependencies,
): Promise<AdminLoginResult> {
  if (!input.address) {
    console.error("Admin login unavailable: trusted client IP missing");
    return { status: 503 };
  }

  let rateLimit: RateLimitResult;
  try {
    rateLimit = await dependencies.checkRateLimit(input.address, input.email);
  } catch (error) {
    logFailure("Admin login rate limit unavailable", error);
    return { status: 503 };
  }

  if (rateLimit.status === "unavailable") return { status: 503 };
  if (rateLimit.status === "limited") {
    console.info("Admin login rate limited", {
      retryAfterSeconds: Math.ceil(rateLimit.retryAfterMs / 1000),
      environment: process.env.NODE_ENV ?? "unknown",
    });
    return { status: 429, retryAfterMs: rateLimit.retryAfterMs };
  }

  try {
    const user = await dependencies.findAdmin(input.email);
    const valid = user ? await dependencies.verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !valid) return { status: 401 };

    await dependencies.createSession(user.id);
    const cleared = await dependencies.clearRateLimits(input.address, input.email);
    if (!cleared) console.error("Admin login throttle reset failed");
    return { status: 200 };
  } catch (error) {
    logFailure("Admin login unavailable", error);
    return { status: 503 };
  }
}
