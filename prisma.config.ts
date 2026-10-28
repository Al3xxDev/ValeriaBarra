import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI uses the direct connection for migrations when a provider
    // exposes a separate pooler URL for serverless runtime traffic.
    url: process.env.DIRECT_URL || process.env.NETLIFY_DB_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres?schema=public",
  },
});
