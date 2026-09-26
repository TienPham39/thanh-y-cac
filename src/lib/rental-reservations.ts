export type ReservedRange = { start: string; end: string };
export function overlapsReservation(start: string, end: string, ranges: ReservedRange[]) {
  return Boolean(start && end && ranges.some(range => start <= range.end && end >= range.start));
}
export function reservationDays(start: string, end: string) {
  const from = Date.parse(`${start}T00:00:00Z`), to = Date.parse(`${end}T00:00:00Z`);
  const count = (to - from) / 86400000 + 1;
  if (!Number.isInteger(count) || count < 1 || count > 366) throw new Error("Khoảng thuê phải từ 1 đến 366 ngày.");
  return Array.from({ length: count }, (_, i) => new Date(from + i * 86400000).toISOString().slice(0, 10));
}
