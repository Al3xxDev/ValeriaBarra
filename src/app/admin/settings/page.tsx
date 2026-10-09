import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { SettingsManager } from "@/components/settings-manager";
import { getActiveAdminSession } from "@/lib/auth";
export default async function AdminSettingsPage() {
  if (!await getActiveAdminSession()) redirect("/admin/login");
  return <div className="admin-layout"><AdminNav /><div className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">Area riservata · Profilo</span><h1>Impostazioni</h1><p>Gestisci i recapiti e le informazioni che appaiono sul sito.</p></div><Link href="/" className="admin-site-link">Apri il sito ↗</Link></header><SettingsManager /></div></div>;
}
