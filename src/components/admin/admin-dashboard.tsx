"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { primaryStyle } from "./admin-shell";
import { apiFetch } from "@/lib/api-fetch";
import DashboardDateFilter, { localToday, type DateRange } from "./dashboard-date-filter";
type Dashboard = { start: string; end: string; total: number; value: number; deposit: number; missing: number; states: Record<string, number>; months: {month: string; value: number; orders: number}[]; top: {code: string; name: string; orders: number}[] };
const statuses = [{ key: "pending", label: "Chờ cọc", color: "#b8872e" }, { key: "confirmed", label: "Đã cọc", color: "#781216" }, { key: "completed", label: "Hoàn tất", color: "#15803d" }, { key: "cancelled", label: "Đã hủy", color: "#a8a29e" }];
const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;
const card = "rounded-xl border border-[#e7e6e9] bg-white p-5 sm:p-6";
export default function AdminDashboard() {
  const [range, setRange] = useState<DateRange>(() => ({start: localToday(), end: localToday()}));
  const [updated, setUpdated] = useState("");
  const [data, setData] = useState<Dashboard | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    async function load() { try {
      const r = await apiFetch(`/api/admin/dashboard?start=${range.start}&end=${range.end}`, {signal: abort.signal}); const body = await r.json();
      if (!r.ok) throw Error(body.error?.message || "Không tải được thống kê.");
      if (!abort.signal.aborted) { setData(body); setError(""); setUpdated(new Date().toLocaleTimeString("vi-VN", {timeZone:"Asia/Ho_Chi_Minh", hour:"2-digit", minute:"2-digit"})); }
    } catch (e) { if (!abort.signal.aborted) setError((e as Error).message); } finally { if (!abort.signal.aborted) setLoading(false); } }
    setLoading(true); setData(null); void load(); const timer = setInterval(load, 30000);
    window.addEventListener("rental-requests-updated", load);
    return () => { abort.abort(); clearInterval(timer); window.removeEventListener("rental-requests-updated", load); };
  }, [range.start, range.end, retry]);
  const maxValue = Math.max(1, ...(data?.months.map(m => m.value) || []));
  const maxOrders = Math.max(1, ...(data?.top.map(p => p.orders) || []));
  let offset = 0;
  return <AdminShell title="Tổng quan kinh doanh" actions={<DashboardDateFilter range={range} onChange={setRange} onRefresh={() => setRetry(n => n + 1)} updated={updated} actions={<Link href="/admin/dat-lich/tao-don/" className={primaryStyle}>+ Tạo đơn thuê</Link>}/>}>
    <p className="mb-4 text-sm text-stone-500">Thống kê theo ngày tạo đơn · Cập nhật mỗi 30 giây</p>
    
    {error && <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-800">{error}<button onClick={() => setRetry(n => n + 1)} className="ml-3 underline">Thử lại</button></div>}
    {loading && <p role="status" className="mb-5 text-sm text-stone-500">Đang tải thống kê…</p>}
    <section aria-label="Chỉ số kinh doanh" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      {label: "Giá trị đơn đã chốt", value: data ? money(data.value) : "—", note: "Đơn đã cọc và hoàn tất; chưa phải tiền thực thu"},
      {label: "Tiền cọc của đơn đã chốt", value: data ? money(data.deposit) : "—", note: "Theo bảng giá lưu; không gồm đơn hủy"},
      {label: "Tổng số đơn", value: data ? data.total.toLocaleString("vi-VN") : "—", note: "Bao gồm tất cả trạng thái"},
      {label: "Đơn chờ cọc", value: data ? String(data.states.pending) : "—", note: "Cần liên hệ và xác nhận với khách"},
    ].map(item => <div className={card} key={item.label}><p className="text-sm text-stone-500">{item.label}</p><p className="mt-3 break-words text-2xl font-semibold text-[#781216]">{item.value}</p><p className="mt-2 text-xs leading-5 text-stone-500">{item.note}</p></div>)}</section>
    {!!data?.missing && <p className="mb-5 text-sm text-amber-800">{data.missing} đơn đã chốt chưa có bảng giá lưu, chưa tính vào thống kê tiền.</p>}
    <div className="grid gap-6 xl:grid-cols-3">
      <section className={`${card} xl:col-span-2`}><h2 className="font-semibold text-[#781216]">Giá trị đơn đã chốt theo thời gian</h2><p className="mt-1 text-xs text-stone-500">Đơn vị: triệu đồng · Theo ngày tạo đơn</p>
        <svg viewBox="0 0 660 260" role="img" aria-label="Biểu đồ đường giá trị đơn theo khoảng ngày" className="mt-5 w-full">{[0,1,2,3,4].map(i => <g key={i}><line x1="55" x2="640" y1={215-i*45} y2={215-i*45} stroke="#e7e6e9"/><text x="48" y={219-i*45} textAnchor="end" fontSize="11" fill="#78716c">{(maxValue*i/4/1000000).toLocaleString("vi-VN", {maximumFractionDigits:2})}</text></g>)}<polyline fill="none" stroke="#781216" strokeWidth="3" points={data?.months.map((m,i) => `${(data && data.months.length > 1 ? 55+i*585/(data.months.length-1) : 347)},${215-m.value/maxValue*180}`).join(" ")} />{data?.months.map((m,i) => <g key={m.month}><circle cx={(data && data.months.length > 1 ? 55+i*585/(data.months.length-1) : 347)} cy={215-m.value/maxValue*180} r="4" fill="#b8872e"><title>{m.month}: {money(m.value)} · {m.orders} đơn</title></circle><text x={(data && data.months.length > 1 ? 55+i*585/(data.months.length-1) : 347)} y="243" textAnchor="middle" fontSize="11" fill="#78716c">{i % Math.max(1, Math.ceil((data?.months.length || 1)/12)) === 0 ? m.month : ""}</text></g>)}</svg>
      </section>
      <section className={card}><h2 className="font-semibold text-[#781216]">Trạng thái đơn thuê</h2><svg viewBox="0 0 220 220" role="img" aria-label="Biểu đồ tròn trạng thái đơn thuê" className="mx-auto mt-4 w-48"><circle cx="110" cy="110" r="78" fill="none" stroke="#f5f5f4" strokeWidth="26"/>{statuses.map(s => { const count = data?.states[s.key] || 0; const size = data?.total ? count/data.total*490.088 : 0; const start = offset; offset += size; return <circle key={s.key} cx="110" cy="110" r="78" fill="none" stroke={s.color} strokeWidth="26" strokeDasharray={`${size} ${490.088-size}`} strokeDashoffset={-start} transform="rotate(-90 110 110)"><title>{s.label}: {count} đơn</title></circle>; })}<text x="110" y="110" textAnchor="middle" fontSize="30" fill="#781216">{data?.total ?? "—"}</text><text x="110" y="133" textAnchor="middle" fontSize="12" fill="#78716c">đơn thuê</text></svg><ul className="space-y-3">{statuses.map(s => <li key={s.key} className="flex items-center gap-2 text-sm"><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill={s.color}/></svg><span className="flex-1">{s.label}</span><strong>{data?.states[s.key] ?? "—"}</strong></li>)}</ul></section>
      <section className={`${card} xl:col-span-3`}><h2 className="font-semibold text-[#781216]">Trang phục được thuê nhiều</h2><p className="mt-1 text-xs text-stone-500">5 trang phục có nhiều đơn đã cọc hoặc hoàn tất nhất</p>{data && !data.top.length ? <p className="py-12 text-center text-sm text-stone-500">Chưa có đơn thuê đã chốt trong khoảng ngày đã chọn.</p> : <div className="mt-6 overflow-x-auto"><svg viewBox="0 0 720 270" role="img" aria-label="Biểu đồ cột trang phục được thuê nhiều" className="min-w-[480px] w-full max-h-80">{data?.top.map((p,i) => <g key={p.code}><rect x={80+i*132} y={210-p.orders/maxOrders*170} width="65" height={p.orders/maxOrders*170} rx="4" fill="#781216"><title>{p.name}: {p.orders} đơn</title></rect><text x={112+i*132} y={200-p.orders/maxOrders*170} textAnchor="middle" fill="#9a6d16" fontSize="14">{p.orders}</text><text x={112+i*132} y="235" textAnchor="middle" fill="#78716c" fontSize="12">{p.code}</text></g>)}<line x1="45" x2="700" y1="210" y2="210" stroke="#e7e6e9"/></svg></div>}</section>
    </div>
  </AdminShell>;
}
