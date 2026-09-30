import vinextWorker from "vinext/server/fetch-handler";
import { runInDbRequestScope } from "./lib/db-scope";

function isCacheablePublicGet(request: Request, url: URL): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const pathname = url.pathname;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) return false;
  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader.includes("up2027_admin_session")) return false;
  if (request.headers.has("next-action") || request.headers.has("x-rsc-action")) return false;

  // Only cache pages whose output is safe to reuse briefly. Survey and
  // results pages stay live because their DB-backed content changes after
  // submissions and admin updates.
  if (
    pathname === "/" ||
    pathname === "/states" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/faq" ||
    pathname === "/methodology" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/disclaimer" ||
    pathname === "/find-constituency" ||
    pathname === "/results" ||
    pathname === "/analysis"
  ) return true;

  if (
    /^\/[^/]+(\/elections\/[^/]+)?(\/constituencies(\/[^/]+)?)?$/.test(pathname) ||
    /^\/[^/]+(\/elections\/[^/]+)?(\/districts(\/[^/]+)?)?$/.test(pathname)
  ) return true;

  return false;
}

function getRequestLocale(request: Request): "hi" | "en" {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/\b(?:locale|up2027_locale)=(en|hi)\b/);
  return (match ? match[1] : "hi") as "hi" | "en";
}

function getCacheKeyUrl(url: URL, locale: string): string {
  const cacheUrl = new URL(url.toString());
  cacheUrl.searchParams.set("__cf_loc", locale);
  return cacheUrl.toString();
}

const worker = {
  async fetch(request: Request, env: any, ctx: any) {
    // Keep the explicit Worker -> process.env bridge. The Vinext/Next server
    // runtime and Prisma code read DATABASE_URL/SESSION_SECRET from process.env.
    // nodejs_compat_populate_process_env is enabled too, but this bridge is
    // intentionally retained because it was the known-working path on this
    // deployment before the Cloudflare migration fixes.
    const globalState = globalThis as typeof globalThis & {
      __DATABASE_URL?: string;
      __SESSION_SECRET?: string;
    };
    if (env?.DATABASE_URL) globalState.__DATABASE_URL = env.DATABASE_URL;
    if (env?.SESSION_SECRET) globalState.__SESSION_SECRET = env.SESSION_SECRET;

    const url = new URL(request.url);

    if (isCacheablePublicGet(request, url)) {
      const locale = getRequestLocale(request);
      const cacheKeyUrl = getCacheKeyUrl(url, locale);
      const cacheKey = new Request(cacheKeyUrl, { method: "GET" });

      try {
        const cache = (caches as any).default;
        if (cache) {
          const cachedResponse = await cache.match(cacheKey);
          if (cachedResponse) {
            const body = await cachedResponse.text();
            const headers = new Headers(cachedResponse.headers);
            headers.set("X-Edge-Cache", "HIT-CF");
            headers.set("X-Response-Locale", locale);
            headers.set("Cache-Control", "public, max-age=60, s-maxage=60");
            return new Response(body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers,
            });
          }
        }
      } catch (err) {
        console.warn("Cloudflare Cache API match error:", err);
      }

      const response = await (vinextWorker as any).fetch(request, env, ctx);

      // A page whose data failed to load is rendered by its error boundary as
      // HTTP 200 with no Cache-Control at all. That must never be stored at
      // the edge (or anywhere downstream) and replayed to other visitors, so
      // mark it no-store and skip the cache.
      if (response && response.status === 200 && !response.headers.has("Cache-Control")) {
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "no-store");
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      }

      if (response && response.status === 200) {
        try {
          const cache = (caches as any).default;
          if (cache) {
            const cacheHeaders = new Headers(response.headers);
            cacheHeaders.set("Cache-Control", "public, max-age=60, s-maxage=60");
            ctx.waitUntil(cache.put(cacheKey, response.clone()));
          }
        } catch (err) {
          console.warn("Cloudflare Cache API put error:", err);
        }
      }

      return response;
    }

    // Default live execution for uncached / non-GET / admin / dynamic requests
    return (vinextWorker as any).fetch(request, env, ctx);
  },
};

export default {
  // Every request runs in its own database scope: on Workers a Postgres
  // WebSocket may only be used by the request that opened it, so the Prisma
  // client must never be shared between requests (see src/lib/db-scope.ts).
  fetch(request: Request, env: any, ctx: any) {
    return runInDbRequestScope(() => worker.fetch(request, env, ctx));
  },
};
