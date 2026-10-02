"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell, { inputStyle, primaryStyle } from "./admin-shell";
import ToastViewport, { type ToastItem } from "./toast";
import { apiFetch } from "@/lib/api-fetch";
import type { CatalogProduct } from "@/lib/catalog-types";
import { rentalQuote } from "@/lib/rental-pricing";
import { parseRentalRequest } from "@/lib/rental-request";

const empty = { productSlug: "", name: "", phone: "", start: "", end: "", height: "", weight: "", note: "" };
export default function AdminCreateRental() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<ToastItem | null>(null);
  const [createdId, setCreatedId] = useState("");
  const [form, setForm] = useState(empty);
  const [productSearch, setProductSearch] = useState("");
  const [reserved, setReserved] = useState<{ start: string; end: string }[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const submission = useRef<{ id: string; payload: string } | null>(null);
  const product = products.find(row => row.slug === form.productSlug);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const validDates = form.start && form.end && form.end >= form.start;
  const days = validDates ? Math.max(1, (Date.parse(form.end) - Date.parse(form.start)) / 86400000) : 1;
  const quote = product && validDates ? rentalQuote(days, product) : null;
  const conflict = reserved.some(row => form.start && form.end && form.start <= row.end && form.end >= row.start);
  const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
  useEffect(() => {
    const abort = new AbortController();
    apiFetch("/api/admin/products", { signal: abort.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Không tải được trang phục.");
      setProducts(body.data);
    }).catch(cause => { if (!abort.signal.aborted) setError(cause.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    setReserved([]); setCalendarError("");
    if (!product) { setCalendarLoading(false); return; }
    const abort = new AbortController();
    setCalendarLoading(true);
    apiFetch(`/api/admin/rental-requests?productCode=${encodeURIComponent(product.code)}`, { signal: abort.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Không tải được lịch thuê.");
      setReserved(body.data);
    }).catch(cause => { if (!abort.signal.aborted) setCalendarError(cause.message); })
      .finally(() => { if (!abort.signal.aborted) setCalendarLoading(false); });
    return () => abort.abort();
  }, [product]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || conflict) return;
    const payload = JSON.stringify(form);
    if (submission.current?.payload !== payload) submission.current = { id: crypto.randomUUID(), payload };
    const data = parseRentalRequest({ ...form, id: submission.current.id }, today);
    if (!data) { setError("Kiểm tra họ tên, số điện thoại, ngày thuê và số đo. Khoảng thuê tối đa 366 ngày."); return; }
    setBusy(true); setError("");
    try {
      const response = await apiFetch("/api/admin/rental-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : body.error?.message || "Chưa tạo được đơn thuê.");
      setCreatedId(body.id);
      setForm(empty);
      setProductSearch("");
      setReserved([]);
      setCalendarError("");
      setCalendarLoading(false);
      submission.current = null;
      setNotification({ id: crypto.randomUUID(), tone: "success", message: "Đã tạo đơn thuê. Xác nhận cọc trong quản lý đơn để giữ lịch." });
      window.dispatchEvent(new Event("rental-requests-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa tạo được đơn thuê."); }
    finally { setBusy(false); }
  }
  return <AdminShell title="Tạo đơn thuê" actions={<Link
      href="/admin/dat-lich/"
      aria-label="Quay lại quản lý thuê đồ"
      className="group inline-flex min-h-9 items-center justify-center gap-2 rounded-[10px] border border-[#b8872e] bg-[#650c13] border !border-[#b8872e] px-4 py-2 text-sm font-semibold text-[#ffebbb] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#80151c] hover:shadow-[0_3px_12px_rgba(184,135,46,0.22)] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8872e]"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:-translate-x-0.5 motion-reduce:transition-none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12H4m0 0 8-8m-8 8 8 8" /></svg>
      Quay lại
    </Link>}>
    <ToastViewport items={notification ? [notification] : []} onDismiss={() => setNotification(null)} />
    <form onSubmit={submit} className="mt-5 max-w-5xl rounded-[2px] border border-[#e7e6e9] bg-white p-5 sm:p-7">
      <h2 className="text-xl font-semibold text-[#80151c]">Tạo đơn thuê trực tiếp</h2>
      <p className="mt-2 text-sm text-stone-500">Dành cho khách đặt qua hotline hoặc tại cửa hàng. Lịch được giữ sau khi xác nhận đã nhận cọc.</p>
      {error && <p role="alert" className="mt-4 rounded-[2px] bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {createdId && <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link className={primaryStyle} href={`/admin/dat-lich/?requestId=${encodeURIComponent(createdId)}`}>Mở đơn và xác nhận cọc</Link>
      </div>}
      <fieldset disabled={busy || loading} className="mt-6 grid gap-5 sm:grid-cols-2">
        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="text-sm">Trang phục *</legend>
          <input type="search" aria-label="Tìm trang phục theo tên hoặc mã" placeholder="Tìm tên hoặc mã trang phục…" className={inputStyle} value={productSearch} onChange={e => setProductSearch(e.target.value)} />
          {loading ? <p role="status" className="mt-3 text-sm text-stone-500">Đang tải trang phục…</p> : <div className="mt-3 grid max-h-[684px] auto-rows-[106px] gap-2 overflow-y-auto overscroll-contain p-1 sm:max-h-[342px] sm:grid-cols-2 [scrollbar-width:thin] [scrollbar-color:#781216_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#781216] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button]:h-0">
            {products.filter(row => `${row.code} ${row.name}`.toLocaleLowerCase("vi").includes(productSearch.trim().toLocaleLowerCase("vi"))).map(row => <label key={row.slug} className={`flex cursor-pointer items-center gap-3 rounded-[2px] border p-3 transition-colors focus-within:ring-2 focus-within:ring-[#80151c] ${form.productSlug === row.slug ? "border-[#80151c] bg-[#fcf0ed]" : "border-[#e7e6e9] bg-white hover:border-[#80151c]"}`}>
              <input type="radio" name="productSlug" required checked={form.productSlug === row.slug} value={row.slug} onChange={() => setForm({ ...form, productSlug: row.slug })} className="shrink-0 accent-[#80151c]" />
              <Image unoptimized src={row.image} alt="" width={96} height={120} className="h-20 w-16 shrink-0 rounded-[2px] bg-stone-50 object-contain" />
              <span className="min-w-0 text-sm"><span className="block text-xs text-stone-500">{row.code}</span><span className="mt-1 line-clamp-2 font-medium">{row.name}</span><span className="mt-1 block font-semibold text-[#80151c]">{money(row.price)} <span className="font-normal text-stone-500">/ 24 giờ</span></span></span>
            </label>)}
            {!products.some(row => `${row.code} ${row.name}`.toLocaleLowerCase("vi").includes(productSearch.trim().toLocaleLowerCase("vi"))) && <p role="status" className="p-3 text-sm text-stone-500 sm:col-span-2">Không tìm thấy trang phục.</p>}
          </div>}
          {product && <p className="mt-2 text-sm text-[#80151c]">Đã chọn: {product.code} · {product.name} · {money(product.price)} / 24 giờ</p>}
        </fieldset>
        <label className="text-sm">Tên khách hàng *<input required maxLength={120} autoComplete="name" className={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-sm">Số điện thoại *<input required type="tel" autoComplete="tel" className={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="text-sm">Ngày nhận *<input required type="date" min={today} className={inputStyle} value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></label>
        <label className="text-sm">Ngày trả *<input required type="date" min={form.start || today} className={inputStyle} value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></label>
        <label className="text-sm">Chiều cao (cm)<input type="number" min={100} max={230} className={inputStyle} value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} /></label>
        <label className="text-sm">Cân nặng (kg)<input type="number" min={25} max={200} className={inputStyle} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></label>
        <label className="text-sm sm:col-span-2">Ghi chú<textarea maxLength={2000} placeholder="Ví dụ: Khách đặt qua hotline…" className={inputStyle} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
        {product && <div className="rounded-[2px] border border-stone-200 p-4 text-sm sm:col-span-2">
          <h3 className="font-semibold">Lịch đã giữ của {product.code}</h3>
          {calendarLoading ? <p role="status">Đang kiểm tra lịch…</p> : calendarError ? <p role="alert" className="text-red-700">{calendarError}</p> : reserved.length ? <ul className="mt-2 space-y-1">{reserved.map((row, i) => <li key={i}>{row.start.split("-").reverse().join("/")} — {row.end.split("-").reverse().join("/")}</li>)}</ul> : <p className="mt-2 text-stone-500">Chưa có lịch được giữ.</p>}
          {conflict && <p role="alert" className="mt-2 text-red-700">Khoảng ngày đã trùng lịch thuê. Chọn ngày hoặc trang phục khác.</p>}
        </div>}
        {quote && <div className="rounded-[2px] bg-stone-50 p-4 text-sm sm:col-span-2"><p>Tổng tiền thuê: <strong>{money(quote.total)}</strong> · {days} ngày</p><p>Cọc giữ lịch dự kiến: {money(quote.deposit)}</p><p>Còn thanh toán sau cọc: {money(quote.remaining)}</p></div>}
        <button disabled={conflict || calendarLoading || Boolean(calendarError) || !products.length} className={`${primaryStyle} sm:col-span-2 sm:justify-self-start`}>{busy ? "Đang tạo đơn…" : "Tạo đơn thuê"}</button>
      </fieldset>
    </form>
  </AdminShell>;
}
