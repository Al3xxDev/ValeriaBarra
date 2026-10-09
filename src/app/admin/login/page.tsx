import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getActiveAdminSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  if (await getActiveAdminSession()) redirect("/admin");
  return (
    <div className="admin-login-page">
      <Link className="admin-login-brand" href="/" aria-label="Valeria Barra Studio">
        <BrandMark className="admin-login-mark" aria-hidden="true" />
        <span className="admin-login-brand-text">
          <strong>Valeria Barra</strong>
          <span>Studio</span>
        </span>
      </Link>
      <div className="admin-login-card">
        <span className="eyebrow">Area riservata</span>
        <h1>Buongiorno,<br /><em>Valeria.</em></h1>
        <p>Accedi per gestire le richieste e i contenuti del sito.</p>
        <AdminLoginForm />
        <Link className="login-back" href="/">← Torna al sito</Link>
      </div>
      <span className="admin-login-note">Accesso riservato · Valeria Barra</span>
    </div>
  );
}
