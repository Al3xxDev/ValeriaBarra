-- CreateTable
CREATE TABLE "MediaPayload" (
    "key" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'image/webp',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaPayload_pkey" PRIMARY KEY ("key")
);
