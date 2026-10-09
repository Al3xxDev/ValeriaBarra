"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { HelpTooltip } from "@/components/help-tooltip";

function adminPreviewUrl(source: string) {
  const id = source.match(/^\/api\/media\/([a-z0-9]+)$/i)?.[1];
  return id ? "/api/admin/media/" + id : source;
}

export function MediaUrlField({ name, label, initial = "", altFieldName, allowUrl = true }: { name: string; label: string; initial?: string; altFieldName: string; allowUrl?: boolean }) {
  const [url, setUrl] = useState(initial);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const original = input.files?.[0];
    const form = input.form;
    if (!original || !form) return;
    const altText = String(new FormData(form).get(altFieldName) ?? "").trim();
    if (!altText) { setStatus("Inserisci prima il testo alternativo dell’immagine."); input.value = ""; return; }
    setPending(true); setStatus("Ottimizzo e carico l’immagine…");
    try {
      let file = original;
      if (original.type.startsWith("image/")) {
        try {
          const bitmap = await createImageBitmap(original);
          const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
          canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .82));
          if (blob) file = new File([blob], "immagine.webp", { type: "image/webp" });
        } catch { /* The server still decodes and re-encodes the image. */ }
      }
      const data = new FormData(); data.set("file", file); data.set("altText", altText);
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Caricamento non riuscito.");
      setUrl(result.url); setStatus("Immagine ottimizzata e salvata. La preview è privata finché il contenuto non viene pubblicato.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Caricamento non riuscito."); }
    finally { setPending(false); input.value = ""; }
  }

  function clearImage() {
    setUrl("");
    setStatus("Immagine rimossa dal contenuto. Il file resta privato finché non viene eliminato dallo storage.");
  }

  return <div className="upload-field">
    <label>
      <span className="label-text">
        {label}
        <HelpTooltip
          label={label}
          title={label}
          text={
            allowUrl
              ? "Carica un file dal tuo computer (JPG, PNG o WebP) oppure specifica un percorso immagine. Il file viene compresso e ottimizzato automaticamente. È necessario compilare prima il testo alternativo per l'accessibilità."
              : "Carica un file JPG, PNG o WebP dal tuo computer. Per motivi di riservatezza, le foto di questa sezione vengono custodite in uno storage protetto e non sono consentiti link esterni non controllati."
          }
        />
      </span>
      <input name={name} value={url} onChange={(event) => setUrl(event.target.value)} readOnly={!allowUrl} maxLength={500} placeholder={allowUrl ? "/images/... oppure URL immagine" : "Carica un’immagine; gli URL esterni non sono ammessi"} />
    </label>
    <label className="upload-button">{pending ? "Caricamento…" : "Carica file"}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label={"Carica " + label.toLowerCase()} disabled={pending} onChange={upload} /></label>
    {url && <div className="upload-preview"><div>{url.match(/^\/api\/media\/[a-z0-9]+$/i) ? <Image src={adminPreviewUrl(url)} alt="" fill unoptimized sizes="220px" /> : <Image src={url} alt="" fill unoptimized sizes="220px" />}</div><button type="button" className="text-button" onClick={clearImage}>Rimuovi immagine</button></div>}
    {status && <span className="upload-status" role="status">{status}</span>}
  </div>;
}
