import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { BookingManager } from "@/components/booking-manager";
import { getActiveAdminSession } from "@/lib/auth";
export default async function AdminBookingsPage() {
  if (!await getActiveAdminSession()) redirect("/admin/login");
  return <div className="admin-layout"><AdminNav /><div className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">Area riservata · Contatti</span><h1>Prenotazioni</h1><p>Leggi le richieste e aggiorna lo stato del contatto.</p></div><Link href="/" className="admin-site-link">Apri il sito ↗</Link></header><BookingManager /></div></div>;
}
