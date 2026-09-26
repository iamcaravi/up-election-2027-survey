import vinextWorker from "vinext/server/fetch-handler";

function isCacheablePublicGet(request: Request, url: URL): boolean {
  // Only cache GET and HEAD
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  const pathname = url.pathname;

  // Never cache admin routes or admin API
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return false;

  // Never cache API routes (preserve dynamic behavior and real Neon data)
  if (pathname.startsWith("/api/")) return false;

  // Never cache if an admin session cookie is present
  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader.includes("up2027_admin_session")) return false;

  // Never cache Next.js server actions or data mutation headers
  if (request.headers.has("next-action") || request.headers.has("x-rsc-action")) return false;

  // Safe public pages that can be cached for a short period (60s)
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
  ) {
    return true;
  }

  // Public constituency survey and results pages
  if (pathname.endsWith("/survey") || pathname.endsWith("/results")) {
    return true;
  }

  // Public state / district / election / constituency listings
  if (
    /^\/[^/]+(\/elections\/[^/]+)?(\/constituencies(\/[^/]+)?)?$/.test(pathname) ||
    /^\/[^/]+(\/elections\/[^/]+)?(\/districts(\/[^/]+)?)?$/.test(pathname)
  ) {
    return true;
  }

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

interface MemoryCacheEntry {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  expiresAt: number;
}

const MEMORY_CACHE = new Map<string, MemoryCacheEntry>();
const MEMORY_CACHE_TTL_MS = 60 * 1000;
const MAX_MEMORY_ENTRIES = 128;

function getFromMemoryCache(key: string): MemoryCacheEntry | null {
  const entry = MEMORY_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    MEMORY_CACHE.delete(key);
    return null;
  }
  return entry;
}

function putInMemoryCache(key: string, entry: Omit<MemoryCacheEntry, "expiresAt">) {
  if (MEMORY_CACHE.size >= MAX_MEMORY_ENTRIES) {
    const oldestKey = MEMORY_CACHE.keys().next().value;
    if (oldestKey) MEMORY_CACHE.delete(oldestKey);
  }
  MEMORY_CACHE.set(key, { ...entry, expiresAt: Date.now() + MEMORY_CACHE_TTL_MS });
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);

    if (isCacheablePublicGet(request, url)) {
      const locale = getRequestLocale(request);
      const cacheKeyUrl = getCacheKeyUrl(url, locale);
      const cacheKey = new Request(cacheKeyUrl, { method: "GET" });

      // 1. Try fast in-memory isolate cache (< 0.05 ms CPU)
      const memCached = getFromMemoryCache(cacheKeyUrl);
      if (memCached) {
        const headers = new Headers(memCached.headers);
        headers.set("X-Edge-Cache", "HIT-MEM");
        headers.set("X-Response-Locale", locale);
        headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
        return new Response(memCached.body, {
          status: memCached.status,
          statusText: memCached.statusText,
          headers,
        });
      }

      // 2. Try Cloudflare Cache API (caches.default)
      try {
        const cache = (caches as any).default;
        if (cache) {
          const cachedResponse = await cache.match(cacheKey);
          if (cachedResponse) {
            const body = await cachedResponse.text();
            const headers = new Headers(cachedResponse.headers);
            headers.set("X-Edge-Cache", "HIT-CF");
            headers.set("X-Response-Locale", locale);
            headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

            putInMemoryCache(cacheKeyUrl, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: Array.from(headers.entries()),
              body,
            });

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

      // 3. Live SSR execution
      const response = await (vinextWorker as any).fetch(request, env, ctx);

      // Only cache successful 200 responses
      if (response && response.status === 200) {
        // Cache a clone asynchronously; never buffer the live response before
        // returning it to the visitor.
        try {
          const cache = (caches as any).default;
          if (cache) {
            const cacheHeaders = new Headers(response.headers);
            cacheHeaders.set("Cache-Control", "public, max-age=60, s-maxage=60");
            ctx.waitUntil(cache.put(cacheKey, new Response(response.clone().body, {
              status: response.status,
              statusText: response.statusText,
              headers: cacheHeaders,
            })));
          }
        } catch (err) {
          console.warn("Cloudflare Cache API put error:", err);
        }
      }

      return response;

      return response;
    }

    // Default live execution for uncached / non-GET / admin / dynamic requests
    return (vinextWorker as any).fetch(request, env, ctx);
  },
};
