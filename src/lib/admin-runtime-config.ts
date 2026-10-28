export type AdminRuntimeConfigIssue = {
  stage: "database_configuration" | "session_configuration";
  category: "database_url_missing" | "auth_secret_missing_or_invalid";
};

/** Check required production settings by presence only; never return their values. */
export function getAdminRuntimeConfigIssues(
  environment: { DATABASE_URL?: string; NETLIFY_DB_URL?: string; AUTH_SECRET?: string } = {
    DATABASE_URL: process.env.DATABASE_URL,
    NETLIFY_DB_URL: process.env.NETLIFY_DB_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
): AdminRuntimeConfigIssue[] {
  const issues: AdminRuntimeConfigIssue[] = [];
  if (!environment.DATABASE_URL?.trim() && !environment.NETLIFY_DB_URL?.trim()) {
    issues.push({ stage: "database_configuration", category: "database_url_missing" });
  }
  if (!environment.AUTH_SECRET || environment.AUTH_SECRET.length < 32) {
    issues.push({ stage: "session_configuration", category: "auth_secret_missing_or_invalid" });
  }
  return issues;
}
