"use client";

/* THESIS: A familiar Vietnamese month calendar makes the rental period visible.
 * OWN-WORLD: Showroom wine-red endpoints, warm gold range, ivory day cells.
 * STORY: Choose pickup, choose return, read the duration and estimated price.
 * FIRST VIEWPORT: Two date selectors, month navigation, Monday-first day grid.
 * FORM: Local extension of the existing booking panel; user-supplied calendar. */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { addDays, calendarDays, dateFromKey, formatRentalDate, selectRentalDate, shiftMonth,
  type RentalDateField, type RentalRange } from "@/lib/rental-calendar";
import { overlapsReservation, type ReservedRange } from "@/lib/rental-reservations";
import { Icon } from "./icon";

export function RentalDatePicker({ value, onChange, today, reserved = [] }: {
  value: RentalRange; onChange: (range: RentalRange) => void; today: string; reserved?: ReservedRange[];
}) {
  const [selectionError, setSelectionError] = useState("");
  const [month, setMonth] = useState(() => shiftMonth(value.start || today, 0));
  const [field, setField] = useState<RentalDateField>("start");
  const [focused, setFocused] = useState(value.start || today);
  const pendingFocus = useRef(false);
  const dayButtons = useRef(new Map<string, HTMLButtonElement>());
  const id = useId();
  const monthLabel = `Tháng ${Number(month.slice(5, 7))} / ${month.slice(0, 4)}`;
  const days = calendarDays(month);
  const currentMonth = shiftMonth(today, 0);

  useEffect(() => {
    if (pendingFocus.current) {
      dayButtons.current.get(focused)?.focus();
      pendingFocus.current = false;
    }
  }, [focused, month]);

  function showMonth(next: string) {
    setMonth(next);
    setFocused(next === currentMonth ? today : next);
  }

  function choose(date: string) {
    const next = selectRentalDate(value, date, field, today);
    if (overlapsReservation(next.start, next.end || next.start, reserved)) { setSelectionError("Khoảng thuê có ngày đã được đặt. Vui lòng chọn khoảng khác."); return; }
    setSelectionError("");
    onChange(next);
    setField(next.end ? "start" : "end");
    setFocused(date);
    setMonth(shiftMonth(date, 0));
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = (dateFromKey(date).getUTCDay() + 6) % 7;
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
    if (!(event.key in offsets) && event.key !== "PageUp" && event.key !== "PageDown") return;
    event.preventDefault();
    let next = event.key === "PageUp" ? shiftMonth(date, -1)
      : event.key === "PageDown" ? shiftMonth(date, 1) : addDays(date, offsets[event.key]);
    if (next < today) next = today;
    pendingFocus.current = true;
    setFocused(next);
    setMonth(shiftMonth(next, 0));
    if (next === focused) pendingFocus.current = false;
  }

  return <div className="font-['Inter']">
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Ngày nhận và trả đồ">
      {([{ key: "start", label: "Ngày nhận đồ" }, { key: "end", label: "Ngày trả đồ" }] as const).map(item => (
        <button key={item.key} type="button" aria-pressed={field === item.key}
          onClick={() => {
            setField(item.key);
            const date = value[item.key] || value.start || today;
            setMonth(shiftMonth(date, 0));
            setFocused(date);
          }}
          className={`min-h-[58px] min-w-0 rounded-lg border px-3 py-2 text-left transition-colors ${field === item.key ? "border-[#38322e] bg-white text-[#302b29]" : "border-[#e2c8c1] bg-white/50 text-[#665e58]"}`}>
          <span className="block text-xs">{item.label}</span>
          <span className="mt-1 block text-sm font-semibold tabular-nums">{formatRentalDate(value[item.key])}</span>
        </button>
      ))}
    </div>
    <p id={`${id}-hint`} className="mb-2 mt-2 min-h-5 text-xs leading-5 text-[#765f5a]" aria-live="polite">
      {selectionError || (value.start && value.end ? "Đã chọn khoảng thuê. Bấm ngày khác để chọn lại." : field === "start" ? "Chọn ngày bạn muốn nhận trang phục." : "Tiếp theo, chọn ngày trả đồ trên lịch.")}
    </p>
    <div className="flex items-center justify-between border-y border-[#e2c8c1] py-1">
      <button type="button" aria-label="Tháng trước" disabled={month <= currentMonth}
        onClick={() => showMonth(shiftMonth(month, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#80151c] hover:bg-white disabled:cursor-not-allowed disabled:opacity-30">
        <Icon name="chevron" className="!h-4 !w-4 rotate-180" />
      </button>
      <h3 id={`${id}-month`} aria-live="polite" className="text-base font-semibold text-[#74131b]">{monthLabel}</h3>
      <button type="button" aria-label="Tháng sau" onClick={() => showMonth(shiftMonth(month, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#80151c] hover:bg-white">
        <Icon name="chevron" className="!h-4 !w-4" />
      </button>
    </div>
    <div role="group" aria-labelledby={`${id}-month`} aria-describedby={`${id}-hint`}>
      <div className="grid grid-cols-7 py-2 text-center text-xs font-semibold text-[#765f5a]" aria-hidden="true">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, index) => <span key={day} className={index > 4 ? "text-[#80151c]" : ""}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0">
        {days.map(date => {
          const isStart = date === value.start;
          const isEnd = date === value.end;
          const selected = isStart || isEnd;
          const inRange = Boolean(value.start && value.end && date >= value.start && date <= value.end);
          const outside = date.slice(0, 7) !== month.slice(0, 7);
          const past = date < today;
          const booked = overlapsReservation(date,date,reserved);
          return <div key={date} className={`${inRange ? "bg-[#f7dfaf]" : ""} ${isStart ? "rounded-l-lg" : ""} ${isEnd ? "rounded-r-lg" : ""}`}>
            <button type="button" disabled={past} aria-disabled={booked || past} tabIndex={date === focused ? 0 : -1}
              ref={node => { if (node) dayButtons.current.set(date, node); else dayButtons.current.delete(date); }}
              aria-label={`${formatRentalDate(date, true)}${booked ? ", đã được đặt" : ""}${date === today ? ", hôm nay" : ""}${isStart ? ", ngày nhận đồ" : ""}${isEnd ? ", ngày trả đồ" : ""}`}
              aria-pressed={inRange || selected} aria-current={date === today ? "date" : undefined}
              onClick={() => choose(date)} onKeyDown={event => onKeyDown(event, date)}
              onFocus={() => setFocused(date)}
              className={`${booked ? "line-through bg-red-50 text-red-800 cursor-not-allowed" : ""} relative flex min-h-9 w-full items-center justify-center rounded-lg text-sm tabular-nums transition-colors focus-visible:z-10 disabled:cursor-not-allowed disabled:text-[#b6a39e] ${selected ? "bg-[#80151c] border !border-[#b8872e] font-semibold text-white" : inRange ? "font-medium text-[#684714] hover:bg-[#efd098]" : `${outside ? "text-[#8b7770]" : "text-[#3f2724]"} enabled:hover:bg-white`} ${date === today && !selected ? "ring-1 ring-inset ring-[#a87836]" : ""}`}>
              {Number(date.slice(8))}
            </button>
          </div>;
        })}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 border-t border-[#e2c8c1] pt-2 text-xs">
      <div className="flex items-center gap-3 text-[#765f5a]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-[#a87836]" />Hôm nay</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#80151c]" />Đã chọn</span>
      </div>
      <button type="button" className="min-h-9 font-semibold text-[#80151c] underline-offset-4 hover:underline" onClick={() => showMonth(currentMonth)}>Về hôm nay</button>
    </div>
  </div>;
}
