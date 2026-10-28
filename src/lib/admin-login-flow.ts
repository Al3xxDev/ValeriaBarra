import type { RateLimitResult } from "@/lib/rate-limit";
import type { AdminRuntimeConfigIssue } from "@/lib/admin-runtime-config";
import { classifyAuthFailure, logAuthDiagnostic } from "@/lib/auth-diagnostics";

export type LoginAdminRecord = { id: string; passwordHash: string };
export type AdminLoginResult =
  | { status: 200 }
  | { status: 401 }
  | { status: 429; retryAfterMs: number }
  | { status: 503 };

export type AdminLoginDependencies = {
  configurationIssues?(): AdminRuntimeConfigIssue[];
  checkRateLimit(address: string, email: string): Promise<RateLimitResult>;
  findAdmin(email: string): Promise<LoginAdminRecord | null>;
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  createSession(userId: string): Promise<void>;
  clearRateLimits(address: string, email: string): Promise<boolean>;
};

export async function authenticateAdmin(
  input: { address: string | null; email: string; password: string; requestId?: string },
  dependencies: AdminLoginDependencies,
): Promise<AdminLoginResult> {
  const requestId = input.requestId ?? "local-untracked";
  const configurationIssues = dependencies.configurationIssues?.() ?? [];
  if (configurationIssues.length > 0) {
    for (const issue of configurationIssues) {
      logAuthDiagnostic({ event: "admin_login_unavailable", requestId, ...issue });
    }
    return { status: 503 };
  }

  if (!input.address) {
    logAuthDiagnostic({ event: "admin_login_unavailable", requestId, stage: "resolve_client_ip", category: "trusted_client_ip_missing" });
    return { status: 503 };
  }

  let rateLimit: RateLimitResult;
  try {
    rateLimit = await dependencies.checkRateLimit(input.address, input.email);
  } catch (error) {
    logAuthDiagnostic({ event: "admin_login_unavailable", requestId, stage: "rate_limit_check", category: classifyAuthFailure(error) });
    return { status: 503 };
  }

  if (rateLimit.status === "unavailable") {
    logAuthDiagnostic({
      event: "admin_login_unavailable",
      requestId,
      stage: "rate_limit_check",
      category: rateLimit.reason ?? "rate_limit_storage_unavailable",
    });
    return { status: 503 };
  }
  if (rateLimit.status === "limited") {
    logAuthDiagnostic({
      event: "admin_login_rate_limited",
      requestId,
      stage: "rate_limit_check",
      category: `retry_after_${Math.ceil(rateLimit.retryAfterMs / 1000)}s`,
    });
    return { status: 429, retryAfterMs: rateLimit.retryAfterMs };
  }

  let user: LoginAdminRecord | null;
  try {
    user = await dependencies.findAdmin(input.email);
  } catch (error) {
    logAuthDiagnostic({ event: "admin_login_unavailable", requestId, stage: "account_lookup", category: classifyAuthFailure(error) });
    return { status: 503 };
  }

  if (!user) {
    logAuthDiagnostic({ event: "admin_login_rejected", requestId, stage: "credential_check", category: "account_not_found" });
    return { status: 401 };
  }

  let valid: boolean;
  try {
    valid = await dependencies.verifyPassword(input.password, user.passwordHash);
  } catch (error) {
    logAuthDiagnostic({ event: "admin_login_unavailable", requestId, stage: "password_verification", category: classifyAuthFailure(error) });
    return { status: 503 };
  }
  if (!valid) {
    logAuthDiagnostic({ event: "admin_login_rejected", requestId, stage: "credential_check", category: "password_mismatch" });
    return { status: 401 };
  }

  try {
    await dependencies.createSession(user.id);
  } catch (error) {
    logAuthDiagnostic({ event: "admin_login_unavailable", requestId, stage: "session_creation", category: classifyAuthFailure(error) });
    return { status: 503 };
  }

  try {
    await dependencies.clearRateLimits(input.address, input.email);
  } catch (error) {
    logAuthDiagnostic({ event: "admin_login_throttle_reset_failed", requestId, stage: "rate_limit_reset", category: classifyAuthFailure(error) });
  }

  return { status: 200 };
}
