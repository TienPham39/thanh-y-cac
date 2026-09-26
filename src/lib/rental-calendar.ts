export type RentalRange = { start: string; end: string };
export type RentalDateField = "start" | "end";

// Date-only arithmetic uses UTC so daylight-saving offsets cannot change the price.
export function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00Z`);
}

export function addDays(key: string, days: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function vietnamToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function shiftMonth(key: string, offset: number) {
  const date = dateFromKey(key);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 10);
}

export function calendarDays(month: string) {
  const first = shiftMonth(month, 0);
  const offset = (dateFromKey(first).getUTCDay() + 6) % 7;
  const last = addDays(shiftMonth(first, 1), -1);
  const count = Math.ceil((offset + dateFromKey(last).getUTCDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => addDays(first, index - offset));
}

export function selectRentalDate(range: RentalRange, date: string, field: RentalDateField, today: string): RentalRange {
  if (date < today) return range;
  if (field === "start" || !range.start || date < range.start) return { start: date, end: "" };
  return { start: range.start, end: date };
}

export function rentalDayCount(start: string, end: string) {
  if (!start || !end || end < start) return null;
  const days = (dateFromKey(end).getTime() - dateFromKey(start).getTime()) / 86_400_000;
  return Number.isFinite(days) ? Math.max(1, days) : null;
}

export function formatRentalDate(key: string, long = false) {
  if (!key) return "Chưa chọn";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric",
    ...(long ? { weekday: "long" as const } : {}),
  }).format(dateFromKey(key));
}
