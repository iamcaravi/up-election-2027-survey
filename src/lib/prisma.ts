import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  const log = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  return connectionString
    ? new PrismaClient({
        adapter: new PrismaNeon({ connectionString }),
        log: log as ("error" | "warn")[],
      })
    : new PrismaClient({
        log: log as ("error" | "warn")[],
      });
}

// In React Server Components & server execution, cache() memoizes the instance per request.
const getRequestScopedClient = cache(() => createPrismaClient());

export function getPrismaClient(): PrismaClient {
  const isCloudflareWorker =
    typeof (globalThis as any).WebSocketPair !== "undefined" ||
    (globalThis as any).navigator?.userAgent === "Cloudflare-Workers";

  if (!isCloudflareWorker) {
    if (!globalForPrisma.prismaClient) {
      globalForPrisma.prismaClient = createPrismaClient();
    }
    return globalForPrisma.prismaClient;
  }

  return getRequestScopedClient();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});


