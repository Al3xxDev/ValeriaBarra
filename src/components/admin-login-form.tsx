"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError(""); setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const result = await response.json() as { error?: string; requestId?: string; category?: string };
      if (!response.ok) {
        let reason = "";
        if (result.category) {
          switch (result.category) {
            case "database_url_missing":
              reason = "DATABASE_URL non configurato su Netlify";
              break;
            case "auth_secret_missing_or_invalid":
              reason = "AUTH_SECRET assente o inferiore a 32 caratteri";
              break;
            case "trusted_client_ip_missing":
              reason = "IP client non rilevato";
              break;
            case "database_unreachable":
              reason = "database non raggiungibile";
              break;
            case "database_schema_mismatch":
              reason = "migrazioni database non applicate";
              break;
            case "database_authentication_failed":
              reason = "credenziali database non valide";
              break;
            default:
              reason = result.category;
          }
        }
        const details = [reason ? `Causa: ${reason}` : null, result.requestId ? `ID: ${result.requestId}` : null]
          .filter(Boolean)
          .join(" · ");
        const requestSuffix = details ? ` (${details})` : "";
        throw new Error(`${result.error ?? "Accesso non riuscito."}${requestSuffix}`);
      }
      router.replace("/admin"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Accesso non riuscito."); }
    finally { submitting.current = false; setPending(false); }
  }
  return <form className="admin-login-form" onSubmit={submit}><label>Email<input type="email" name="email" autoComplete="username" required maxLength={254} /></label><label>Password<input type="password" name="password" autoComplete="current-password" required maxLength={200} /></label>{error && <p className="form-status error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Accesso…" : "Accedi"} <span aria-hidden="true">↗</span></button></form>;
}
