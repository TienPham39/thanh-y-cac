function firstHeaderValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

export function isSameOriginRequest(requestUrl: string, headers: Pick<Headers, "get">) {
  const rawOrigin = headers.get("origin");
  if (!rawOrigin) return false;

  try {
    const origin = new URL(rawOrigin);
    const internalUrl = new URL(requestUrl);
    const host = firstHeaderValue(headers.get("x-forwarded-host"))
      ?? firstHeaderValue(headers.get("host"))
      ?? internalUrl.host;
    const protocol = firstHeaderValue(headers.get("x-forwarded-proto"))
      ?? internalUrl.protocol.slice(0, -1);

    return origin.host.toLowerCase() === host.toLowerCase()
      && origin.protocol.toLowerCase() === `${protocol.toLowerCase()}:`;
  } catch {
    return false;
  }
}
