"use client";

import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Page error", error.digest ?? error.name); }, [error]);
  return <div className="not-found page-gutter"><span className="eyebrow">Qualcosa non ha funzionato</span><h1>Riproviamo<br /><em>con calma.</em></h1><p>La pagina non è disponibile in questo momento.</p><button className="button" onClick={() => reset()}>Riprova <span aria-hidden="true">↗</span></button></div>;
}
