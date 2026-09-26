"use client";

import { useEffect, useRef, useState } from "react";
import { RentalDatePicker } from "./rental-date-picker";
import { formatRentalDate, rentalDayCount, vietnamToday, type RentalRange } from "@/lib/rental-calendar";
import { formatPrice } from "@/lib/home-data";
import { overlapsReservation, type ReservedRange } from "@/lib/rental-reservations";
import { RentalPriceSummary } from "./rental-price-summary";
import { Icon } from "./icon";

export function RentalDatePopover({ range, onChange, price, productSlug }: {
  range: RentalRange; onChange: (range: RentalRange) => void; price: number; productSlug: string;
}) {
  const [reserved, setReserved] = useState<ReservedRange[]>([]);
  const [availability, setAvailability] = useState<"loading"|"ready"|"error">("loading");
  useEffect(() => {
    let active = true;
    async function load() {
      try {const response = await fetch("/api/products/availability?slug="+encodeURIComponent(productSlug), {cache:"no-store"});if(!response.ok)throw new Error();const result=await response.json();if(active){setReserved(result.data);setAvailability("ready");}}
      catch {if(active)setAvailability("error");}
    }
    void load();const timer=setInterval(load,15000);window.addEventListener("focus",load);
    return()=>{active=false;clearInterval(timer);window.removeEventListener("focus",load);};
  }, [productSlug]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <div ref={root} id="dat-lich" className="relative scroll-mt-8 bg-[#f5f4f2] p-4 sm:p-5"
    onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm font-semibold">Thuê trang phục</p><p className="mt-1 text-xs text-[#68635f]">{formatPrice(price)} / 24 giờ</p></div>
      <button ref={trigger} id="rental-date-trigger" type="button" aria-expanded={open} aria-controls="rental-calendar-popover"
        onClick={() => { if (open) close(); else { setDraft(range); setOpen(true); } }}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#d8c9c3] bg-white px-4 py-2.5 text-sm font-medium text-[#74131b] transition hover:border-[#80151c] hover:bg-[#fff8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80151c]/30 sm:w-auto">
        <span>{range.start ? formatRentalDate(range.start) : "Từ ngày"} <span className="mx-2 text-[#827a74]">—</span> {range.end ? formatRentalDate(range.end) : "Đến ngày"}</span><Icon name="calendar" className="!h-4 !w-4 shrink-0" />
      </button>
    </div>
    <RentalPriceSummary range={range} price={price} />
    <div className="mt-3 text-xs leading-5" aria-live="polite">
      {availability==="loading" ? <p>Đang tải lịch đã đặt…</p> : availability==="error" ? <p className="text-red-800">Chưa tải được lịch. Vui lòng thử lại sau hoặc liên hệ cửa hàng.</p> : reserved.length ? <ul className="max-h-28 overflow-y-auto text-[#781216]">{reserved.map(item=><li key={item.start+item.end}>Đã được đặt từ {formatRentalDate(item.start)} đến {formatRentalDate(item.end)}</li>)}</ul> : <p className="text-stone-600">Chưa có lịch đã xác nhận cọc.</p>}
      {overlapsReservation(range.start,range.end,reserved)&&<p className="font-medium text-red-800">Khoảng bạn chọn vừa được đặt. Vui lòng chọn lại ngày.</p>}
    </div>
    {open && <div ref={panel} id="rental-calendar-popover" role="region" aria-label="Chọn khoảng ngày thuê"
      className="absolute left-0 right-0 top-full z-30 mt-2 bg-white p-4 shadow-[0_8px_32px_rgba(35,25,20,0.16)] sm:left-auto sm:w-[340px] lg:fixed lg:left-auto lg:right-6 lg:top-1/2 lg:mt-0 lg:max-h-[calc(100dvh-32px)] lg:-translate-y-1/2 lg:overflow-y-auto lg:overscroll-contain">
      {availability === "ready" && <RentalDatePicker value={draft} today={vietnamToday()} onChange={setDraft} reserved={reserved} />}
      <p className="mt-2 text-xs leading-5 text-[#68635f]">Ngày gạch ngang đã được đặt. Khóa cả ngày nhận và ngày trả; yêu cầu chưa xác nhận cọc chưa giữ lịch.</p>
      <RentalPriceSummary range={draft} price={price} />
      <div className="mt-3 flex justify-end gap-3">
        <button type="button" onClick={close} className="min-h-10 rounded-md px-4 text-sm">Hủy</button>
        <button type="button" disabled={availability !== "ready" || !rentalDayCount(draft.start, draft.end) || overlapsReservation(draft.start,draft.end,reserved)} onClick={() => { onChange(draft); close(); }} className="min-h-10 rounded-md bg-[#80151c] px-6 text-sm font-semibold text-white hover:bg-[#590008] disabled:cursor-not-allowed disabled:opacity-40">Áp dụng</button>
      </div>
    </div>}
  </div>;
}
