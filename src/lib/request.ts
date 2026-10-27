import { isIP } from "node:net";
import { getContext } from "@netlify/functions";

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    return originUrl.origin === new URL(request.url).origin;
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
