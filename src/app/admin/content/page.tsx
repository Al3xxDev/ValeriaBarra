import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { ContentManager } from "@/components/content-manager";
import { getActiveAdminSession } from "@/lib/auth";
export default async function AdminContentPage() {
  if (!await getActiveAdminSession()) redirect("/admin/login");
  return <div className="admin-layout"><AdminNav /><div className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">Area riservata · Editoriale</span><h1>Contenuti</h1><p>Crea bozze e pubblica aggiornamenti, ricette e storie condivise.</p></div><Link href="/" className="admin-site-link">Apri il sito ↗</Link></header><ContentManager /></div></div>;
}
