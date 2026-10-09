"use client";

export function CookiePreferencesTrigger() {
  return <button className="cookie-settings-trigger" onClick={() => window.dispatchEvent(new Event("vb-cookie-settings"))}>Preferenze</button>;
}
