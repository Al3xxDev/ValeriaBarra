import { BeforeAfterStatus } from "@prisma/client";
import { z } from "zod";

const mediaPath = z.union([z.literal(""), z.string().regex(/^\/api\/media\/[a-z0-9]+$/i)]);

export const beforeAfterCaseSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(3000),
  goal: z.string().trim().max(500).optional().default(""),
  journey: z.string().trim().max(3000).optional().default(""),
  duration: z.string().trim().max(80).optional().default(""),
  resultDescription: z.string().trim().max(2000).optional().default(""),
  testimonial: z.string().trim().max(2000).optional().default(""),
  imageBefore: mediaPath.optional().default(""),
  imageAfter: mediaPath.optional().default(""),
  imageBeforeAlt: z.string().trim().max(300).optional().default(""),
  imageAfterAlt: z.string().trim().max(300).optional().default(""),
  contentConsent: z.boolean(),
  imagesConsent: z.boolean(),
  contentConsentNotes: z.string().trim().max(1000).optional().default(""),
  imagesConsentNotes: z.string().trim().max(1000).optional().default(""),
  anonymized: z.boolean(),
  status: z.nativeEnum(BeforeAfterStatus),
});

export type BeforeAfterCaseInput = z.infer<typeof beforeAfterCaseSchema>;

export function mediaAssetId(value: string | undefined) {
  return value?.match(/^\/api\/media\/([a-z0-9]+)$/i)?.[1];
}

export function publicationIssues(input: BeforeAfterCaseInput) {
  const issues: string[] = [];
  if (!input.contentConsent) issues.push("il consenso alla pubblicazione del contenuto");
  if (!input.imagesConsent) issues.push("il consenso alla pubblicazione delle immagini");
  if (!input.anonymized) issues.push("la conferma che il caso è anonimizzato");
  if (!input.goal.trim()) issues.push("l’obiettivo generale");
  if (!input.imageBefore || !input.imageAfter) issues.push("entrambe le immagini caricate nello storage privato");
  if (!input.imageBeforeAlt.trim() || !input.imageAfterAlt.trim()) issues.push("il testo alternativo di entrambe le immagini");
  const beforeId = mediaAssetId(input.imageBefore);
  const afterId = mediaAssetId(input.imageAfter);
  if (beforeId && afterId && beforeId === afterId) issues.push("due immagini diverse per prima e dopo");
  return issues;
}
