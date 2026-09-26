import assert from "node:assert/strict";
import test from "node:test";
import { calendarDays, shiftMonth, rentalDayCount, selectRentalDate, vietnamToday } from "./rental-calendar.ts";

test("calendar starts on Monday and includes leap day", () => {
  const days = calendarDays("2028-02-01");
  assert.equal(days[0], "2028-01-31");
  assert.ok(days.includes("2028-02-29"));
  assert.equal(days.length % 7, 0);
});

test("month navigation crosses the year without skipping February", () => {
  assert.equal(shiftMonth("2026-12-01", 1), "2027-01-01");
  assert.equal(shiftMonth("2026-01-01", -1), "2025-12-01");
  assert.equal(shiftMonth("2026-01-31", 1), "2026-02-01");
});

test("range selection resets the return date and rejects dates before today", () => {
  const today = "2026-09-26";
  assert.deepEqual(selectRentalDate({ start: "", end: "" }, "2026-09-25", "start", today), { start: "", end: "" });
  assert.deepEqual(selectRentalDate({ start: "2026-09-27", end: "2026-09-29" }, "2026-10-01", "start", today), { start: "2026-10-01", end: "" });
  assert.deepEqual(selectRentalDate({ start: "2026-09-28", end: "" }, "2026-09-27", "end", today), { start: "2026-09-27", end: "" });
  assert.deepEqual(selectRentalDate({ start: "2026-09-28", end: "" }, "2026-09-28", "end", today), { start: "2026-09-28", end: "2026-09-28" });
});

test("rental pricing counts nights with a one-day minimum, including year and leap boundaries", () => {
  assert.equal(rentalDayCount("", ""), null);
  assert.equal(rentalDayCount("2026-09-28", "2026-09-27"), null);
  assert.equal(rentalDayCount("2026-09-28", "2026-09-28"), 1);
  assert.equal(rentalDayCount("2026-12-31", "2027-01-02"), 2);
  assert.equal(rentalDayCount("2028-02-28", "2028-03-01"), 2);
});

test("today follows Vietnam time around midnight", () => {
  assert.equal(vietnamToday(new Date("2026-09-25T18:00:00Z")), "2026-09-26");
});
