import Link from "next/link";
export default function NotFound() { return <div className="not-found page-gutter"><span className="eyebrow">404 · Pagina non trovata</span><h1>Questo sentiero<br /><em>finisce qui.</em></h1><p>La pagina che cerchi potrebbe essere stata spostata o non esistere più.</p><Link className="button" href="/">Torna alla home <span aria-hidden="true">↗</span></Link></div>; }
