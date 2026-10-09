-- Replace the public boolean with an explicit lifecycle and a stable public slug.
CREATE TYPE "BeforeAfterStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ConsentScope" AS ENUM ('CONTENT', 'IMAGES');

DROP INDEX "BeforeAfterCase_published_consentRecordedAt_idx";

ALTER TABLE "BeforeAfterCase"
ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "slug" TEXT,
ADD COLUMN "status" "BeforeAfterStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "anonymized" SET DEFAULT false;

-- Keep only legacy rows that already satisfy the stronger publication rules.
UPDATE "BeforeAfterCase"
SET
  "slug" = 'storia-' || lower("id"),
  "status" = CASE
    WHEN "published" = true
      AND "contentConsent" = true
      AND "imagesConsent" = true
      AND "anonymized" = true
      AND "consentRecordedAt" IS NOT NULL
      AND "imageBeforeId" IS NOT NULL
      AND "imageAfterId" IS NOT NULL
      AND NULLIF(btrim("imageBeforeAlt"), '') IS NOT NULL
      AND NULLIF(btrim("imageAfterAlt"), '') IS NOT NULL
    THEN 'PUBLISHED'::"BeforeAfterStatus"
    ELSE 'DRAFT'::"BeforeAfterStatus"
  END,
  "publishedAt" = CASE
    WHEN "published" = true
      AND "contentConsent" = true
      AND "imagesConsent" = true
      AND "anonymized" = true
      AND "consentRecordedAt" IS NOT NULL
      AND "imageBeforeId" IS NOT NULL
      AND "imageAfterId" IS NOT NULL
      AND NULLIF(btrim("imageBeforeAlt"), '') IS NOT NULL
      AND NULLIF(btrim("imageAfterAlt"), '') IS NOT NULL
    THEN COALESCE("updatedAt", "createdAt")
    ELSE NULL
  END;

ALTER TABLE "BeforeAfterCase" ALTER COLUMN "slug" SET NOT NULL;

-- Preserve historical consent state as auditable consent events.
ALTER TABLE "ConsentRecord"
ALTER COLUMN "scope" TYPE "ConsentScope" USING upper("scope")::"ConsentScope";

INSERT INTO "ConsentRecord" ("id", "caseId", "scope", "granted", "recordedAt", "notes")
SELECT 'migration-content-' || "id", "id", 'CONTENT'::"ConsentScope", true,
       COALESCE("consentRecordedAt", "createdAt"), 'Consenso storico migrato dal record precedente.'
FROM "BeforeAfterCase"
WHERE "contentConsent" = true
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ConsentRecord" ("id", "caseId", "scope", "granted", "recordedAt", "notes")
SELECT 'migration-images-' || "id", "id", 'IMAGES'::"ConsentScope", true,
       COALESCE("consentRecordedAt", "createdAt"), 'Consenso immagini storico migrato dal record precedente.'
FROM "BeforeAfterCase"
WHERE "imagesConsent" = true
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "BeforeAfterCase" DROP COLUMN "published";

CREATE UNIQUE INDEX "BeforeAfterCase_slug_key" ON "BeforeAfterCase"("slug");
CREATE INDEX "BeforeAfterCase_status_publishedAt_idx" ON "BeforeAfterCase"("status", "publishedAt");
CREATE INDEX "BeforeAfterCase_contentConsent_imagesConsent_anonymized_idx" ON "BeforeAfterCase"("contentConsent", "imagesConsent", "anonymized");
CREATE INDEX "ConsentRecord_caseId_scope_recordedAt_idx" ON "ConsentRecord"("caseId", "scope", "recordedAt");
CREATE INDEX "ConsentRecord_caseId_scope_granted_withdrawnAt_idx" ON "ConsentRecord"("caseId", "scope", "granted", "withdrawnAt");
