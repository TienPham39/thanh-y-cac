"use client";

import { useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { RentalPriceSummary } from "./rental-price-summary";
import { Icon } from "./icon";
import ToastViewport, { type ToastItem } from "./admin/toast";
import { formatRentalDate, type RentalRange } from "@/lib/rental-calendar";

const inputClass = "mt-1.5 min-h-12 min-w-0 w-full rounded-xl border border-[#c8c0b8] bg-white px-3 font-['Inter'] text-sm outline-none transition focus:border-[#80151c] focus:ring-2 focus:ring-[#80151c]/15";

export default function ProductBookingPanel({ product, range, onReset }: { product: CatalogProduct; range: RentalRange; onReset: () => void }) {
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<ToastItem | null>(null);
  function setError(message: string) {
    setNotification(message ? { id: crypto.randomUUID(), message, tone: "error" } : null);
  }
  const pending = useRef(false);
  const submission = useRef({ payload: "", id: "" });
  return (
    <>
      <ToastViewport items={notification ? [notification] : []} onDismiss={() => setNotification(null)} />
      <form id="thong-tin-giu-do" aria-labelledby="rental-contact-title" onSubmit={async event => {
        event.preventDefault();
        if (pending.current) return;
        if (!range.start || !range.end) { setError("Vui lòng chọn ngày nhận và ngày trả đồ."); document.getElementById("rental-date-trigger")?.focus(); return; }
        const form = event.currentTarget;
        const fields = Object.fromEntries(new FormData(form));
        const data = { ...fields, productSlug: product.slug, start: range.start, end: range.end };
        const payload = JSON.stringify(data);
        if (submission.current.payload !== payload) submission.current = { payload, id: crypto.randomUUID() };
        pending.current = true; setSaving(true); setError("");
        try {
          const response = await fetch("/api/rental-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, id: submission.current.id }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Chưa lưu được yêu cầu.");
          form.reset();
          onReset();
          submission.current = { payload: "", id: "" };
          setNotification({ id: crypto.randomUUID(), tone: "success", message: "Đã gửi yêu cầu đặt thuê và thông báo cho quản trị viên. Cửa hàng sẽ liên hệ để xác nhận cọc và giữ đồ." });
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa lưu được yêu cầu. Vui lòng thử lại."); }
        finally { pending.current = false; setSaving(false); }
      }} className="mx-auto mt-8 lg:mt-10 w-full max-w-[860px] min-w-0 scroll-mt-8 border-t border-[#e6e2de] bg-white pt-8">
        <div className="mb-6 flex items-start justify-between gap-4"><div><h2 id="rental-contact-title" className="!font-['Inter'] text-lg font-semibold text-[#302b29]">Thông tin đăng ký giữ đồ</h2><p className="mt-1 font-['Inter'] text-sm text-[#665e58]">Thông tin chỉ dùng để tư vấn và xác nhận lịch thuê.</p></div><Icon name="shield" className="shrink-0 text-[#665e58]" /></div>
        <p className="mb-5 text-sm text-[#68635f]">Ngày thuê: {formatRentalDate(range.start)} — {formatRentalDate(range.end)}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-['Inter'] text-sm font-medium">Họ và tên *<input className={inputClass} name="name" autoComplete="name" required maxLength={120} /></label>
          <label className="font-['Inter'] text-sm font-medium">Số điện thoại / Zalo *<input className={inputClass} name="phone" inputMode="tel" autoComplete="tel" minLength={9} maxLength={20} required /></label>
          <label className="font-['Inter'] text-sm font-medium">Chiều cao (cm)<input className={inputClass} name="height" type="number" min={100} max={230} /></label>
          <label className="font-['Inter'] text-sm font-medium">Cân nặng (kg)<input className={inputClass} name="weight" type="number" min={25} max={200} /></label>
          <label className="font-['Inter'] text-sm font-medium sm:col-span-2">Ghi chú đặc biệt<textarea className={`${inputClass} min-h-24 py-3`} name="note" maxLength={2000} placeholder="Ví dụ: cần bóp eo, phối trâm cài hoặc tư vấn concept…" /></label>
        </div>
        <p className="mt-5 text-xs leading-5 text-[#765f5a]">Yêu cầu được gửi đến cửa hàng để xử lý. Trang phục chỉ được giữ lịch sau khi quản trị viên xác nhận đã nhận cọc.</p>
        <RentalPriceSummary range={range} {...product} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="submit" disabled={saving} className="disabled:opacity-50 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#781216] bg-[#781216] px-5 font-['Inter'] text-sm font-semibold text-white transition hover:bg-[#5e1012]"><Icon name="calendar" />{saving ? "Đang gửi yêu cầu…" : "Gửi yêu cầu đặt thuê"}</button>
          <a href="https://zalo.me/0779312303" target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#781216]/30 px-5 text-sm font-semibold text-[#781216] transition hover:bg-[#781216]/5"><Icon name="chat" />Tư vấn qua Zalo</a>
        </div>
      </form>
    </>
  );
}
