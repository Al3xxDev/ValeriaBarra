import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieConsent } from "@/components/cookie-consent";
import { MotionEnhancer } from "@/components/motion-enhancer";
import { getSiteSettings } from "@/lib/content";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(baseUrl),
    title: { default: settings.seoTitle ?? `${settings.name} | ${settings.qualification} a ${settings.city}`, template: `%s | ${settings.name}` },
    description: settings.seoDescription ?? `Percorsi nutrizionali a ${settings.city}. Un approccio consapevole, concreto e costruito intorno alla tua vita.`,
    alternates: { canonical: "/" },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: `${settings.name} · ${settings.qualification}`,
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: `${settings.name} · ${settings.qualification} a ${settings.city}` },
      ],
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it" data-scroll-behavior="smooth"><body><MotionEnhancer /><a className="skip-link" href="#main-content">Vai al contenuto</a><SiteHeader /><main id="main-content">{children}</main><SiteFooter /><CookieConsent /></body></html>;
}
