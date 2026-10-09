"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Accesso non riuscito.");
      router.replace("/admin"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Accesso non riuscito."); }
    finally { setPending(false); }
  }
  return <form className="admin-login-form" onSubmit={submit}><label>Email<input type="email" name="email" autoComplete="username" required maxLength={254} /></label><label>Password<input type="password" name="password" autoComplete="current-password" required maxLength={200} /></label>{error && <p className="form-status error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Accesso…" : "Accedi"} <span aria-hidden="true">↗</span></button></form>;
}
