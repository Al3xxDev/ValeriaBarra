export type AuthFailureCategory =
  | "database_authentication_failed"
  | "database_unreachable"
  | "database_timeout"
  | "database_schema_mismatch"
  | "database_initialization_failed"
  | "database_operation_failed"
  | "database_url_missing"
  | "auth_secret_invalid"
  | "auth_secret_missing_or_invalid"
  | "internal_error";

type SafeErrorShape = { name?: unknown; code?: unknown };

/** Return a safe, low-cardinality category without logging messages or values. */
export function classifyAuthFailure(error: unknown): AuthFailureCategory {
  if (!error || typeof error !== "object") return "internal_error";

  const { name, code } = error as SafeErrorShape;
  if (code === "AUTH_SECRET_INVALID" || name === "AuthConfigurationError") return "auth_secret_invalid";

  switch (code) {
    case "P1000": return "database_authentication_failed";
    case "P1001": return "database_unreachable";
    case "P1002": return "database_timeout";
    case "P2021":
    case "P2022": return "database_schema_mismatch";
  }

  if (name === "PrismaClientInitializationError") return "database_initialization_failed";
  if (typeof name === "string" && name.startsWith("PrismaClient")) return "database_operation_failed";
  return "internal_error";
}

export type AuthDiagnostic = {
  event: "admin_login_unavailable" | "admin_login_rejected" | "admin_login_rate_limited" | "admin_login_throttle_reset_failed";
  requestId: string;
  stage: string;
  category: string;
};

export function logAuthDiagnostic(diagnostic: AuthDiagnostic) {
  const line = JSON.stringify(diagnostic);
  if (diagnostic.event === "admin_login_unavailable" || diagnostic.event === "admin_login_throttle_reset_failed") {
    console.error(line);
  } else {
    console.info(line);
  }
}
