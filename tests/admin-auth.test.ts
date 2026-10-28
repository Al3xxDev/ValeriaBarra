import assert from "node:assert/strict";
import test from "node:test";
import { authenticateAdmin, type AdminLoginDependencies } from "../src/lib/admin-login-flow";
import { classifyAuthFailure } from "../src/lib/auth-diagnostics";
import { getAdminRuntimeConfigIssues } from "../src/lib/admin-runtime-config";
import { adminLoginRateLimits, advanceRateLimit, getLoginRateLimitKeys } from "../src/lib/rate-limit-policy";
import { clientAddress, isSameOrigin, resolveClientAddress } from "../src/lib/request";

const initialDependencies = (overrides: Partial<AdminLoginDependencies> = {}): AdminLoginDependencies => ({
  checkRateLimit: async () => ({ status: "allowed" }),
  findAdmin: async () => ({ id: "admin-id", passwordHash: "stored-hash" }),
  verifyPassword: async () => true,
  createSession: async () => undefined,
  clearRateLimits: async () => true,
  ...overrides,
});

async function captureErrors<T>(operation: () => Promise<T>) {
  const originalError = console.error;
  const entries: string[] = [];
  console.error = (...args: unknown[]) => { entries.push(String(args[0])); };
  try {
    return { result: await operation(), entries };
  } finally {
    console.error = originalError;
  }
}

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

test("clientAddress resolves client IP from Netlify x-nf-client-connection-ip header", () => {
  const env = process.env as Record<string, string | undefined>;
  const previousEnv = env.NODE_ENV;
  try {
    env.NODE_ENV = "production";
    const req = new Request("https://studio.example.test/api/admin/login", {
      headers: {
        "x-nf-client-connection-ip": "203.0.113.195",
      },
    });
    assert.equal(clientAddress(req), "203.0.113.195");
  } finally {
    env.NODE_ENV = previousEnv;
  }
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

test("origin validation accepts reverse-proxy TLS offloading and Netlify deployment origins while rejecting external origins", () => {
  const previousUrl = process.env.URL;
  const previousSiteName = process.env.SITE_NAME;

  try {
    process.env.URL = "https://valeriabarra.netlify.app";
    process.env.SITE_NAME = "valeriabarra";

    // TLS offloading where edge terminated HTTPS but forwarded HTTP to backend
    const tlsOffloaded = new Request("http://valeriabarra.netlify.app/api/admin/login", {
      headers: {
        origin: "https://valeriabarra.netlify.app",
        "x-forwarded-proto": "https",
      },
    });
    assert.equal(isSameOrigin(tlsOffloaded), true);

    // Netlify Functions runtime internal target URL matching configured site URL
    const serverlessTarget = new Request("http://localhost:3000/api/admin/login", {
      headers: {
        origin: "https://valeriabarra.netlify.app",
        host: "valeriabarra.netlify.app",
      },
    });
    assert.equal(isSameOrigin(serverlessTarget), true);

    // Netlify deploy preview matching site name
    const deployPreview = new Request("http://localhost:3000/api/admin/login", {
      headers: {
        origin: "https://deploy-preview-42--valeriabarra.netlify.app",
      },
    });
    assert.equal(isSameOrigin(deployPreview), true);

    // External attacker origin rejected
    const externalAttacker = new Request("http://valeriabarra.netlify.app/api/admin/login", {
      headers: {
        origin: "https://malicious.example",
      },
    });
    assert.equal(isSameOrigin(externalAttacker), false);

    // Another unrelated Netlify site rejected
    const otherNetlifySite = new Request("http://localhost:3000/api/admin/login", {
      headers: {
        origin: "https://other-site.netlify.app",
      },
    });
    assert.equal(isSameOrigin(otherNetlifySite), false);

    // Insecure HTTP origin rejected against HTTPS target
    const insecureOrigin = new Request("https://valeriabarra.netlify.app/api/admin/login", {
      headers: {
        origin: "http://valeriabarra.netlify.app",
      },
    });
    assert.equal(isSameOrigin(insecureOrigin), false);
  } finally {
    process.env.URL = previousUrl;
    process.env.SITE_NAME = previousSiteName;
  }
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

test("login diagnostics identify rate limiter, database schema, and session configuration failures without logging raw errors", async () => {
  const requestId = "netlify-request-123";
  const cases = [
    {
      stage: "rate_limit_check",
      category: "database_unreachable",
      deps: initialDependencies({ checkRateLimit: async () => { throw Object.assign(new Error("do not log this"), { code: "P1001" }); } }),
    },
    {
      stage: "account_lookup",
      category: "database_schema_mismatch",
      deps: initialDependencies({ findAdmin: async () => { throw Object.assign(new Error("do not log this"), { code: "P2021" }); } }),
    },
    {
      stage: "session_creation",
      category: "auth_secret_invalid",
      deps: initialDependencies({ createSession: async () => { throw Object.assign(new Error("secret value must not appear"), { name: "AuthConfigurationError", code: "AUTH_SECRET_INVALID" }); } }),
    },
  ];

  for (const testCase of cases) {
    const { result, entries } = await captureErrors(() => authenticateAdmin({
      address: "203.0.113.8",
      email: "admin@example.test",
      password: "private-password",
      requestId,
    }, testCase.deps));

    assert.deepEqual(result, { status: 503 });
    const event = JSON.parse(entries[0]) as Record<string, string>;
    assert.equal(event.requestId, requestId);
    assert.equal(event.stage, testCase.stage);
    assert.equal(event.category, testCase.category);
    assert.equal(entries.join(" ").includes("do not log this"), false);
    assert.equal(entries.join(" ").includes("secret value"), false);
    assert.equal(entries.join(" ").includes("private-password"), false);
  }
});

test("diagnostic categories map common Prisma connection and migration errors safely", () => {
  assert.equal(classifyAuthFailure({ code: "P1000" }), "database_authentication_failed");
  assert.equal(classifyAuthFailure({ code: "P1002" }), "database_timeout");
  assert.equal(classifyAuthFailure({ code: "P2022" }), "database_schema_mismatch");
  assert.equal(classifyAuthFailure({ name: "PrismaClientInitializationError" }), "database_initialization_failed");
  assert.equal(classifyAuthFailure(new Error("unclassified")), "internal_error");
});

test("missing production database and session settings fail closed with precise stages", async () => {
  const issues = getAdminRuntimeConfigIssues({ DATABASE_URL: "", AUTH_SECRET: "short" });
  assert.deepEqual(issues, [
    { stage: "database_configuration", category: "database_url_missing" },
    { stage: "session_configuration", category: "auth_secret_missing_or_invalid" },
  ]);

  let rateLimitCalls = 0;
  const { result, entries } = await captureErrors(() => authenticateAdmin({
    address: "203.0.113.8",
    email: "admin@example.test",
    password: "private-password",
    requestId: "deploy-request-456",
  }, initialDependencies({
    configurationIssues: () => issues,
    checkRateLimit: async () => { rateLimitCalls += 1; return { status: "allowed" }; },
  })));

  assert.deepEqual(result, { status: 503 });
  assert.equal(rateLimitCalls, 0);
  assert.equal(entries.length, 2);
  assert.equal(entries.join(" ").includes("private-password"), false);
  assert.deepEqual(entries.map((entry) => JSON.parse(entry)).map((entry) => [entry.stage, entry.category]), [
    ["database_configuration", "database_url_missing"],
    ["session_configuration", "auth_secret_missing_or_invalid"],
  ]);
});

test("Netlify Database connection is accepted as the production Postgres URL", () => {
  assert.deepEqual(getAdminRuntimeConfigIssues({ NETLIFY_DB_URL: "postgresql://database", AUTH_SECRET: "a".repeat(32) }), []);
});

test("allowAdminLogin executes advisory lock and records attempt in PostgreSQL without deserialization errors", async () => {
  const { allowAdminLogin } = await import("../src/lib/rate-limit");
  const result = await allowAdminLogin("127.0.0.1", "integration-lock-test@example.test");
  assert.equal(result.status, "allowed");
});

