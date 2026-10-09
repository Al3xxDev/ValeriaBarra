"use client";

import { useEffect, useState } from "react";

const storageKey = "vb-cookie-preference";

function startAnalytics(measurementId: string) {
  if (document.getElementById("vb-google-analytics")) return;
  const script = document.createElement("script");
  script.id = "vb-google-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) { window.dataLayer?.push(args); };
  window.gtag("js", new Date());
  window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("config", measurementId, { anonymize_ip: true });
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const preference = localStorage.getItem(storageKey);
      setVisible(preference === null);
      const measurementId = process.env.NEXT_PUBLIC_GA_ID;
      if (preference === "analytics" && measurementId) startAnalytics(measurementId);
    }, 0);
    const showPreferences = () => setVisible(true);
    window.addEventListener("vb-cookie-settings", showPreferences);
    return () => { window.clearTimeout(timer); window.removeEventListener("vb-cookie-settings", showPreferences); };
  }, []);

  function choose(analytics: boolean) {
    localStorage.setItem(storageKey, analytics ? "analytics" : "essential");
    setVisible(false);
    const measurementId = process.env.NEXT_PUBLIC_GA_ID;
    if (analytics && measurementId) {
      startAnalytics(measurementId);
    } else if (window.gtag) {
      window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      document.cookie.split(";").map((cookie) => cookie.trim().split("=")[0]).filter((name) => name === "_ga" || name.startsWith("_ga_")).forEach((name) => { document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`; });
    }
  }

  if (!visible) return null;
  return (
    <aside className="cookie-notice" aria-label="Preferenze cookie">
      <div><strong>La tua privacy, prima di tutto.</strong><p>Usiamo solo strumenti tecnici necessari. Le statistiche, se attivate, partono solo con il tuo consenso.</p></div>
      <div className="cookie-actions"><button className="button button-quiet" onClick={() => choose(false)}>Solo necessari</button><button className="button button-small" onClick={() => choose(true)}>Accetta statistiche</button></div>
    </aside>
  );
}

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}
