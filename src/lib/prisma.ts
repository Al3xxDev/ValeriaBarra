import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const datasourceUrl = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;
export const prisma = globalForPrisma.prisma ?? new PrismaClient(
  datasourceUrl ? { datasourceUrl } : undefined,
);
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
