import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { dbRequestScope } from "./db-scope";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
  prismaScopeWarned?: boolean;
};

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

function isWorkersRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured for the server runtime.");
  }

  const log = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString,
      // A Worker request may hold at most 6 simultaneous outbound connections;
      // a larger pool makes the 7th parallel query wait for an idle socket to
      // time out. Keep the pool small and well under that limit.
      max: 4,
      // Release the WebSocket shortly after the request's last query instead
      // of holding it (and the request context) open for the 10 s default.
      idleTimeoutMillis: 2_000,
      // Fail with a catchable error instead of hanging if Neon is unreachable.
      connectionTimeoutMillis: 10_000,
    }),
    log: log as ("error" | "warn")[],
  });
}

// The Neon driver's pool owns WebSockets, and on Cloudflare Workers a socket
// can only be used by the request that opened it (see db-scope.ts). So:
//   - Worker: one client per request scope, never shared across requests.
//   - Node (next dev / next start / scripts): one client per process.
export function getPrismaClient(): PrismaClient {
  const scope = dbRequestScope.getStore();
  if (scope) return (scope.prisma ??= createPrismaClient());

  if (isWorkersRuntime()) {
    // No request scope on a Worker should not happen (worker-wrapper.ts wraps
    // every request). Never fall back to a shared client here — that is the
    // cross-request failure. Use a throwaway client and make it visible.
    if (!globalForPrisma.prismaScopeWarned) {
      globalForPrisma.prismaScopeWarned = true;
      console.error("[db] Prisma used outside a request scope on Workers; using an unshared client.");
    }
    return createPrismaClient();
  }

  return (globalForPrisma.prismaClient ??= createPrismaClient());
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
