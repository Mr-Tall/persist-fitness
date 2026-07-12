import { PrismaClient } from "@prisma/client";
import { getRuntimeEnv } from "@/lib/env";

// Prisma reads DATABASE_URL from schema.prisma; validate it before creating a client.
getRuntimeEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
