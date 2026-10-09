"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

export function AdminNav() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login"); router.refresh();
  }
  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin" aria-label="Studio Valeria Barra — Area riservata">
        <div className="admin-brand-header">
          <BrandMark className="admin-sidebar-mark" variant="light" aria-hidden="true" />
          <span className="eyebrow">Studio</span>
        </div>
        <strong>Valeria Barra</strong>
        <span>Area riservata</span>
      </Link>
      <nav aria-label="Menu amministrazione">
        <Link href="/admin">Panoramica</Link>
        <Link href="/admin/bookings">Prenotazioni</Link>
        <Link href="/admin/content">Contenuti</Link>
        <Link href="/admin/settings">Impostazioni</Link>
      </nav>
      <button className="admin-logout" onClick={logout}>Esci <span aria-hidden="true">↗</span></button>
    </aside>
  );
}
