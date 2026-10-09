import { BeforeAfterStatus, ConsentScope, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function publicBeforeAfterWhere(now = new Date()): Prisma.BeforeAfterCaseWhereInput {
  return {
    status: BeforeAfterStatus.PUBLISHED,
    publishedAt: { not: null, lte: now },
    contentConsent: true,
    imagesConsent: true,
    anonymized: true,
    consentRecordedAt: { not: null },
    imageBeforeId: { not: null },
    imageAfterId: { not: null },
    imageBeforeAlt: { not: "" },
    imageAfterAlt: { not: "" },
    beforeMedia: { is: { mimeType: { in: ["image/webp", "image/jpeg", "image/png", "image/svg+xml"] }, sizeBytes: { gt: 0 }, altText: { not: "" } } },
    afterMedia: { is: { mimeType: { in: ["image/webp", "image/jpeg", "image/png", "image/svg+xml"] }, sizeBytes: { gt: 0 }, altText: { not: "" } } },
    AND: [
      { consentRecords: { some: { scope: ConsentScope.CONTENT, granted: true, withdrawnAt: null } } },
      { consentRecords: { some: { scope: ConsentScope.IMAGES, granted: true, withdrawnAt: null } } },
    ],
  };
}

const publicInclude = {
  beforeMedia: { select: { id: true, altText: true, url: true, mimeType: true, sizeBytes: true } },
  afterMedia: { select: { id: true, altText: true, url: true, mimeType: true, sizeBytes: true } },
} satisfies Prisma.BeforeAfterCaseInclude;

export type PublicBeforeAfterCase = Prisma.BeforeAfterCaseGetPayload<{ include: typeof publicInclude }>;

export async function getPublicBeforeAfterCases() {
  return prisma.beforeAfterCase.findMany({
  where: publicBeforeAfterWhere(),
  include: publicInclude,
  orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPublicBeforeAfterCase(slug: string) {
  return prisma.beforeAfterCase.findFirst({
    where: { ...publicBeforeAfterWhere(), slug },
    include: publicInclude,
  });
}

export async function isPublicBeforeAfterMedia(id: string) {
  const item = await prisma.beforeAfterCase.findFirst({
    where: { ...publicBeforeAfterWhere(), OR: [{ imageBeforeId: id }, { imageAfterId: id }] },
    select: { id: true },
  });
  return Boolean(item);
}
