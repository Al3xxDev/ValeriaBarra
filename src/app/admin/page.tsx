import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { getActiveAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getActiveAdminSession(); if (!session) redirect("/admin/login");
  let stats = { newBookings: 0, recentBookings: [] as { id: string; firstName: string; lastName: string; appointmentType: string; status: string; createdAt: Date }[], articles: 0, recipes: 0, drafts: 0, connected: true };
  try {
    const [newBookings, recentBookings, articles, recipes, articleDrafts, recipeDrafts] = await Promise.all([
      prisma.booking.count({ where: { status: "NEW" } }),
      prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, firstName: true, lastName: true, appointmentType: true, status: true, createdAt: true } }),
      prisma.article.count({ where: { published: true } }), prisma.recipe.count({ where: { published: true } }),
      prisma.article.count({ where: { published: false } }), prisma.recipe.count({ where: { published: false } }),
    ]);
    stats = { newBookings, recentBookings, articles, recipes, drafts: articleDrafts + recipeDrafts, connected: true };
  } catch (error) { console.error("Admin dashboard data unavailable", error instanceof Error ? error.name : "unknown"); stats.connected = false; }
  return <div className="admin-layout"><AdminNav /><div className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">La tua attività, in breve</span><h1>Buongiorno, Valeria.</h1></div><Link href="/" className="admin-site-link">Apri il sito ↗</Link></header>{!stats.connected && <div className="admin-warning" role="status"><strong>Il database non è ancora collegato.</strong><span>Avvia PostgreSQL e segui le istruzioni nel README per iniziare a ricevere richieste.</span></div>}<div className="admin-stat-grid"><article><span className="eyebrow">Nuove richieste</span><strong>{stats.newBookings}</strong><Link href="/admin/bookings">Vedi prenotazioni <span aria-hidden="true">→</span></Link></article><article><span className="eyebrow">News pubblicate</span><strong>{stats.articles}</strong><Link href="/admin/content">Gestisci contenuti <span aria-hidden="true">→</span></Link></article><article><span className="eyebrow">Ricette pubblicate</span><strong>{stats.recipes}</strong><Link href="/admin/content">Gestisci contenuti <span aria-hidden="true">→</span></Link></article><article><span className="eyebrow">Bozze</span><strong>{stats.drafts}</strong><Link href="/admin/content">Riprendi una bozza <span aria-hidden="true">→</span></Link></article></div><section className="admin-recent"><div className="admin-section-header"><div><span className="eyebrow">Attività recente</span><h2>Ultime richieste</h2></div><Link className="text-link" href="/admin/bookings">Tutte le prenotazioni <span aria-hidden="true">→</span></Link></div>{stats.recentBookings.length ? <div className="booking-list">{stats.recentBookings.map((item) => <Link className="booking-row" href="/admin/bookings" key={item.id}><span className="status-dot" /><span className="booking-person"><strong>{item.firstName} {item.lastName}</strong><small>{item.appointmentType} · {new Date(item.createdAt).toLocaleDateString("it-IT")}</small></span><span className="status-pill">{item.status === "NEW" ? "Nuova" : item.status}</span><span className="booking-arrow">→</span></Link>)}</div> : <div className="admin-empty"><strong>Ancora nessuna richiesta.</strong><span>Quando qualcuno ti contatterà, la vedrai qui.</span></div>}</section><div className="admin-privacy-note"><span aria-hidden="true">✳</span><p>Le informazioni inviate dalle persone sono riservate. Accedi solo da un dispositivo protetto e non condividere i dettagli fuori dai canali necessari.</p></div></div></div>;
}
