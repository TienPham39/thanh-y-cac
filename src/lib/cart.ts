export type CartItem = { productSlug: string; start: string; end: string };
export function parseCart(raw: string | null): CartItem[] {
  try {
    const rows: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(rows)) return [];
    const result: CartItem[] = [];
    for (const row of rows)
      if (
        row &&
        typeof row === "object" &&
        typeof row.productSlug === "string" &&
        /^[a-z0-9-]{1,100}$/.test(row.productSlug) &&
        typeof row.start === "string" &&
        typeof row.end === "string" &&
        !result.some((i) => i.productSlug === row.productSlug)
      )
        result.push({
          productSlug: row.productSlug,
          start: /^\d{4}-\d{2}-\d{2}$/.test(row.start) ? row.start : "",
          end: /^\d{4}-\d{2}-\d{2}$/.test(row.end) ? row.end : "",
        });
    return result.slice(0, 8);
  } catch {
    return [];
  }
}
export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  return items.some((i) => i.productSlug === item.productSlug)
    ? items.map((i) => (i.productSlug === item.productSlug ? item : i))
    : [...items, item].slice(0, 8);
}
