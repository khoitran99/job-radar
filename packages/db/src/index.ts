import { PrismaClient } from "@prisma/client";

let cached: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (cached) return cached;
  cached = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  return cached;
}

export type { PrismaClient } from "@prisma/client";
