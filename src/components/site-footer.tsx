import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getSiteSettings } from "@/lib/content";
import { CookiePreferencesTrigger } from "@/components/cookie-preferences-trigger";

export async function SiteFooter() {
  const settings = await getSiteSettings();
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Link className="wordmark footer-wordmark" href="/" aria-label={`${settings.name} — ${settings.qualification}`}>
            <BrandMark className="wordmark-mark footer-mark" aria-hidden="true" />
            <span className="wordmark-text">
              <span className="wordmark-name">{settings.name}</span>
              <span className="wordmark-title">{settings.qualification} · {settings.city}</span>
            </span>
          </Link>
          <p>{settings.shortBio}</p>
        </div>
        <div className="footer-links">
          <div><span className="eyebrow">Esplora</span><Link href="/chi-sono">Chi sono</Link><Link href="/percorsi">Percorsi</Link><Link href="/prima-e-dopo">Storie di percorso</Link><Link href="/ricette">Ricette</Link><Link href="/news">Journal</Link></div>
          <div><span className="eyebrow">Contatti</span><Link href="/prenota">Prenota un incontro</Link>{settings.email && <a href={`mailto:${settings.email}`}>Scrivimi via email</a>}{settings.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}{settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}{settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}{settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer">Facebook ↗</a>}<span>{settings.city}, Italia</span></div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Valeria Barra</span>
        <div><Link href="/privacy">Privacy</Link><Link href="/cookie">Cookie</Link><CookiePreferencesTrigger /></div>
        <span className="footer-note">I contenuti non sostituiscono un consulto professionale.</span>
      </div>
    </footer>
  );
}
