import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
};

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured for the server runtime.");
  }

  const log = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: log as ("error" | "warn")[],
  });
}

// Neon Serverless communicates over HTTP/WebSockets and does not require a
// Node TCP connection pool. Keep one client per Worker isolate instead of
// using React's cache() in API routes. React cache() is request/RSC-oriented
// and is not a reliable lifetime mechanism for Cloudflare route handlers.
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prismaClient) {
    globalForPrisma.prismaClient = createPrismaClient();
  }
  return globalForPrisma.prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
