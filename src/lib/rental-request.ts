export function parseRentalRequest(input: unknown, today: string) {
  if (!input || typeof input !== "object") return null;
  const v = input as Record<string, unknown>;
  const text = (key: string) => typeof v[key] === "string" ? (v[key] as string).trim() : "";
  const id = text("id"), productSlug = text("productSlug"), name = text("name"), phone = text("phone").replace(/[\s().-]/g, "");
  const start = text("start"), end = text("end"), note = text("note");
  const date = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  const measurement = (key: string, min: number, max: number) => {
    if (v[key] === "" || v[key] == null) return null;
    const n = Number(v[key]);
    return Number.isInteger(n) && n >= min && n <= max ? n : NaN;
  };
  const height = measurement("height", 100, 230), weight = measurement("weight", 25, 200);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    || !/^[a-z0-9-]{1,100}$/.test(productSlug) || !name || name.length > 120
    || !/^(0\d{9}|\+84\d{9})$/.test(phone) || !date(start) || !date(end) || start < today || end < start
    || (Date.parse(end) - Date.parse(start)) / 86400000 > 365
    || note.length > 2000 || Number.isNaN(height) || Number.isNaN(weight)) return null;
  return { id, productSlug, name, phone, start, end, height, weight, note };
}
