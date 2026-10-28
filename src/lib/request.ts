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

    const isLocalOrigin = originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1";
    const isLocalTarget = targetUrl.hostname === "localhost" || targetUrl.hostname === "127.0.0.1";
    if (isLocalOrigin && isLocalTarget && originUrl.port === targetUrl.port && originUrl.protocol === targetUrl.protocol) {
      return true;
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

export function clientAddress() {
  let platformAddress: unknown;
  try {
    platformAddress = getContext().ip;
  } catch {
    // Netlify's request context does not exist in the regular Next.js dev server.
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
