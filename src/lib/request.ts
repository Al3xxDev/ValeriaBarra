import { isIP } from "node:net";
import { randomUUID } from "node:crypto";
import { getContext } from "@netlify/functions";

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const targetUrl = new URL(request.url);
    if (originUrl.origin === targetUrl.origin) return true;

    // TLS termination behind reverse proxy: https client origin on the same host as http target
    if (
      originUrl.host === targetUrl.host &&
      originUrl.protocol === "https:" &&
      (targetUrl.protocol === "http:" || request.headers.get("x-forwarded-proto") === "https")
    ) {
      return true;
    }

    // Local loopback aliases (localhost <-> 127.0.0.1)
    const isLocalOrigin = originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1";
    const isLocalTarget = targetUrl.hostname === "localhost" || targetUrl.hostname === "127.0.0.1";
    if (isLocalOrigin && isLocalTarget && originUrl.port === targetUrl.port && originUrl.protocol === targetUrl.protocol) {
      return true;
    }

    // Match against configured site environment variables
    const configuredOrigins = [
      process.env.URL,
      process.env.DEPLOY_PRIME_URL,
      process.env.DEPLOY_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
    ];
    for (const configured of configuredOrigins) {
      if (configured) {
        try {
          if (new URL(configured).origin === originUrl.origin) return true;
        } catch {
          // ignore malformed URLs
        }
      }
    }

    // Match against Netlify request context and site subdomain
    let siteName = process.env.SITE_NAME?.trim()?.toLowerCase();
    try {
      const contextSite = getContext().site;
      if (contextSite?.url && new URL(contextSite.url).origin === originUrl.origin) {
        return true;
      }
      if (contextSite?.name) {
        siteName = contextSite.name.trim().toLowerCase();
      }
    } catch {
      // Netlify context is unavailable outside Netlify Functions.
    }

    if (siteName && originUrl.protocol === "https:") {
      if (
        originUrl.hostname === `${siteName}.netlify.app` ||
        originUrl.hostname.endsWith(`--${siteName}.netlify.app`)
      ) {
        return true;
      }
    }

    // If target is internal/local server behind reverse proxy, match client Host header
    if (isLocalTarget && originUrl.protocol === "https:") {
      const host = request.headers.get("host")?.trim();
      if (host && originUrl.host === host) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function resolveClientAddress(platformAddress: unknown, production: boolean) {
  if (typeof platformAddress === "string") {
    const address = platformAddress.trim();
    if (address && isIP(address)) return address.toLowerCase();
  }

  return production ? null : "development-local";
}

export function clientAddress(request?: Request) {
  let platformAddress: unknown;
  try {
    platformAddress = getContext().ip;
  } catch {
    // Netlify's request context does not exist in the regular Next.js dev server.
  }

  if ((typeof platformAddress !== "string" || !platformAddress.trim()) && request) {
    platformAddress = request.headers.get("x-nf-client-connection-ip")
      ?? request.headers.get("client-ip")
      ?? request.headers.get("x-real-ip")
      ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  }

  return resolveClientAddress(platformAddress, process.env.NODE_ENV === "production");
}

export function requestCorrelationId() {
  try {
    const requestId = getContext().requestId;
    if (typeof requestId === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(requestId)) return requestId;
  } catch {
    // Use a local ID when Netlify request context is unavailable.
  }

  return randomUUID();
}
