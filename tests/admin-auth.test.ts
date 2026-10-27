import assert from "node:assert/strict";
import test from "node:test";
import { authenticateAdmin, type AdminLoginDependencies } from "../src/lib/admin-login-flow";
import { adminLoginRateLimits, advanceRateLimit, getLoginRateLimitKeys } from "../src/lib/rate-limit-policy";
import { isSameOrigin, resolveClientAddress } from "../src/lib/request";

const initialDependencies = (overrides: Partial<AdminLoginDependencies> = {}): AdminLoginDependencies => ({
  checkRateLimit: async () => ({ status: "allowed" }),
  findAdmin: async () => ({ id: "admin-id", passwordHash: "stored-hash" }),
  verifyPassword: async () => true,
  createSession: async () => undefined,
  clearRateLimits: async () => true,
  ...overrides,
});

test("valid admin credentials create a session and clear only the current login limits", async () => {
  const calls: string[] = [];
  const result = await authenticateAdmin({ address: "203.0.113.8", email: "admin@example.test", password: "correct" }, initialDependencies({
    createSession: async (id) => { calls.push(`session:${id}`); },
    clearRateLimits: async (address, email) => { calls.push(`clear:${address}:${email}`); return true; },
  }));

  assert.deepEqual(result, { status: 200 });
  assert.deepEqual(calls, ["session:admin-id", "clear:203.0.113.8:admin@example.test"]);
});

test("wrong passwords are rejected without creating a session", async () => {
  let attempts = 0;
  let sessions = 0;
  const result = await authenticateAdmin({ address: "203.0.113.8", email: "admin@example.test", password: "wrong" }, initialDependencies({
    checkRateLimit: async () => { attempts += 1; return { status: "allowed" }; },
    verifyPassword: async () => false,
    createSession: async () => { sessions += 1; },
  }));

  assert.deepEqual(result, { status: 401 });
  assert.equal(attempts, 1);
  assert.equal(sessions, 0);
});

test("a reached threshold blocks the next request and recovers when the window expires", () => {
  const { limit, windowMs } = adminLoginRateLimits.perAddressAccount;
  const startedAt = 1_000_000;
  let state = null as ReturnType<typeof advanceRateLimit>["state"] | null;

  for (let attempt = 0; attempt < limit; attempt += 1) {
    const next = advanceRateLimit(state, startedAt + attempt, limit, windowMs);
    assert.equal(next.allowed, true);
    state = next.state;
  }

  const blocked = advanceRateLimit(state, startedAt + limit, limit, windowMs);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, windowMs - 1);
  assert.equal(blocked.state.attempts, limit);

  const recovered = advanceRateLimit(state, (state?.blockedUntil ?? startedAt) + 1, limit, windowMs);
  assert.equal(recovered.allowed, true);
  assert.deepEqual(recovered.state, { attempts: 1, windowStartedAt: (state?.blockedUntil ?? startedAt) + 1, blockedUntil: null });
});

test("rate limits are scoped per address and address-account pair, not globally by account", () => {
  const firstAddress = getLoginRateLimitKeys("203.0.113.8", "admin@example.test");
  const secondAddress = getLoginRateLimitKeys("203.0.113.9", "admin@example.test");

  assert.equal(firstAddress[0].scope, "login-ip");
  assert.equal(firstAddress[0].value, "203.0.113.8");
  assert.equal(firstAddress[1].scope, "login");
  assert.notEqual(firstAddress[1].value, secondAddress[1].value);
  assert.equal(firstAddress[1].limit, 5);
  assert.equal(firstAddress[1].windowMs, 15 * 60 * 1000);
});

test("unavailable or invalid production IPs are rejected without trusting forwarding headers", () => {
  assert.equal(resolveClientAddress("198.51.100.10", true), "198.51.100.10");
  assert.equal(resolveClientAddress("not-an-ip", true), null);
  assert.equal(resolveClientAddress("203.0.113.10, 192.0.2.10", true), null);
  assert.equal(resolveClientAddress(undefined, true), null);
  assert.equal(resolveClientAddress(undefined, false), "development-local");
});

test("origin validation compares against the request URL, not client-supplied forwarding headers", () => {
  const spoofed = new Request("https://studio.example.test/api/admin/login", {
    headers: {
      origin: "https://attacker.example",
      "x-forwarded-host": "attacker.example",
      "x-forwarded-proto": "https",
    },
  });
  const sameOrigin = new Request("https://studio.example.test/api/admin/login", {
    headers: { origin: "https://studio.example.test" },
  });

  assert.equal(isSameOrigin(spoofed), false);
  assert.equal(isSameOrigin(sameOrigin), true);
});

test("rate limiting blocks before credential lookup and distinguishes storage failure from lockout", async () => {
  let lookups = 0;
  const limited = await authenticateAdmin({ address: "203.0.113.8", email: "admin@example.test", password: "x" }, initialDependencies({
    checkRateLimit: async () => ({ status: "limited", retryAfterMs: 60_000 }),
    findAdmin: async () => { lookups += 1; return null; },
  }));
  const unavailable = await authenticateAdmin({ address: "203.0.113.8", email: "admin@example.test", password: "x" }, initialDependencies({
    checkRateLimit: async () => ({ status: "unavailable" }),
    findAdmin: async () => { lookups += 1; return null; },
  }));

  assert.deepEqual(limited, { status: 429, retryAfterMs: 60_000 });
  assert.deepEqual(unavailable, { status: 503 });
  assert.equal(lookups, 0);
});

test("a missing trusted IP fails closed without creating an account-wide throttle", async () => {
  let rateLimitCalls = 0;
  const result = await authenticateAdmin({ address: null, email: "admin@example.test", password: "x" }, initialDependencies({
    checkRateLimit: async () => { rateLimitCalls += 1; return { status: "allowed" }; },
  }));

  assert.deepEqual(result, { status: 503 });
  assert.equal(rateLimitCalls, 0);
});
