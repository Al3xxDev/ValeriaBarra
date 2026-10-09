import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getSiteSettings } from "@/lib/content";

const links = [
  ["Chi sono", "/chi-sono"],
  ["Percorsi", "/percorsi"],
  ["Storie", "/prima-e-dopo"],
  ["Ricette", "/ricette"],
  ["Journal", "/news"],
];

export async function SiteHeader() {
  const settings = await getSiteSettings();
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label={`${settings.name} — ${settings.qualification}`}>
        <BrandMark className="wordmark-mark" aria-hidden="true" />
        <span className="wordmark-text">
          <span className="wordmark-name">{settings.name}</span>
          <span className="wordmark-title">{settings.qualification}</span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Navigazione principale">
        {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
      <Link className="button button-small header-cta" href="/prenota">Prenota un incontro <span aria-hidden="true">↗</span></Link>
      <details className="mobile-menu">
        <summary aria-label="Menu di navigazione">Menu <span className="menu-icon" aria-hidden="true"><i /><i /><i /></span></summary>
        <nav aria-label="Navigazione mobile">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          <Link href="/prenota">Prenota un incontro ↗</Link>
        </nav>
      </details>
    </header>
  );
}
