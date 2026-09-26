const productCodePattern = /^[A-Za-z0-9-]{1,40}$/;

export function parseDeleteProductCodes(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const codes = (value as Record<string, unknown>).codes;
  if (!Array.isArray(codes) || codes.length < 1 || codes.length > 100) return null;
  if (codes.some(code => typeof code !== "string" || !productCodePattern.test(code))) return null;
  return [...new Set(codes as string[])];
}
