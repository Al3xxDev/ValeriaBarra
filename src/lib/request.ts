export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const requestHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
      ?? request.headers.get("host")
      ?? new URL(request.url).host;
    const requestProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
      ?? new URL(request.url).protocol.replace(":", "");
    const originUrl = new URL(origin);
    return originUrl.host === requestHost && originUrl.protocol === `${requestProtocol}:`;
  } catch {
    return false;
  }
}

export function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}
