export type RateLimitState = {
  attempts: number;
  windowStartedAt: number;
  blockedUntil: number | null;
};

export type RateLimitTransition = {
  allowed: boolean;
  state: RateLimitState;
  retryAfterMs: number;
  shouldPersist: boolean;
};

export function advanceRateLimit(
  current: RateLimitState | null,
  now: number,
  limit: number,
  windowMs: number,
): RateLimitTransition {
  if (current?.blockedUntil !== null && current?.blockedUntil !== undefined && current.blockedUntil > now) {
    return {
      allowed: false,
      state: current,
      retryAfterMs: current.blockedUntil - now,
      shouldPersist: false,
    };
  }

  if (!current || now - current.windowStartedAt >= windowMs) {
    return {
      allowed: true,
      state: { attempts: 1, windowStartedAt: now, blockedUntil: null },
      retryAfterMs: 0,
      shouldPersist: true,
    };
  }

  const attempts = current.attempts + 1;
  const blockedUntil = attempts >= limit ? now + windowMs : null;
  return {
    allowed: attempts <= limit,
    state: { attempts, windowStartedAt: current.windowStartedAt, blockedUntil },
    retryAfterMs: blockedUntil === null ? 0 : windowMs,
    shouldPersist: true,
  };
}

export const adminLoginRateLimits = {
  perAddress: { scope: "login-ip", limit: 20, windowMs: 15 * 60 * 1000 },
  perAddressAccount: { scope: "login", limit: 5, windowMs: 15 * 60 * 1000 },
} as const;

export function getLoginRateLimitKeys(address: string, email: string) {
  return [
    {
      ...adminLoginRateLimits.perAddress,
      value: address,
    },
    {
      ...adminLoginRateLimits.perAddressAccount,
      value: `${address}:${email}`,
    },
  ];
}
