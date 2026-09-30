import { AsyncLocalStorage } from "node:async_hooks";
import type { PrismaClient } from "@prisma/client";

// Request scope for database clients on Cloudflare Workers.
//
// Workers forbid using an I/O object (socket, stream, …) created while
// handling one request from inside another request ("Cannot perform I/O on
// behalf of a different request"). The Neon driver talks to Postgres over a
// pooled WebSocket, so a PrismaClient kept on globalThis hands request B a
// socket that belongs to request A: the query never settles, the runtime
// detects the hang and answers with Error 1101.
//
// worker-wrapper.ts therefore runs every request inside this scope, and
// prisma.ts creates (at most) one client per scope. The storage lives on
// globalThis so every bundle/environment of the Worker shares one instance.

export interface DbRequestScope {
  prisma?: PrismaClient;
}

const globalForScope = globalThis as typeof globalThis & {
  __dbRequestScope?: AsyncLocalStorage<DbRequestScope>;
};

export const dbRequestScope = (globalForScope.__dbRequestScope ??= new AsyncLocalStorage<DbRequestScope>());

/** Runs `fn` (one Worker request) with its own database scope. */
export function runInDbRequestScope<T>(fn: () => T): T {
  return dbRequestScope.run({}, fn);
}
