"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AdminProduct, blankProduct, categories, money, sampleProducts, statuses, storageKey } from "@/lib/admin-products";
import AdminShell, { buttonStyle, inputStyle, primaryStyle } from "./admin-shell";
import ProductEditor from "./product-editor";
import { Icon } from "../icon";

export default function AdminProducts({ editor = false }: { editor?: boolean }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    let rows = sampleProducts();
    try {
      const stored = localStorage.getItem(storageKey);
      if(stored) {
        const parsed: unknown = JSON.parse(stored);
        if(!Array.isArray(parsed) || parsed.some(row => !row || typeof row.id !== "string" || typeof row.name !== "string" || !Array.isArray(row.images))) throw Error("Invalid drafts");
        rows = parsed.map(row => ({ ...blankProduct(), ...row }));
      }
    } catch { setStorageError(true); setError("Không đọc được bản nháp đã lưu. Đã khóa thao tác lưu để bảo vệ dữ liệu cũ. Vui lòng dùng trình duyệt khác để xem thử giao diện."); }
    setProducts(rows); setLoaded(true);
    if(editor) {
      const id = new URLSearchParams(window.location.search).get("id");
      if(id === "new") setEditing(blankProduct());
      else if(id && !rows.some(row => row.id === id)) setError("Không tìm thấy trang phục. Hãy chọn lại từ danh sách.");
      else setEditing(rows.find(row => row.id === id) || rows[0] || blankProduct());
    }
  }, [editor]);
  function persist(rows: AdminProduct[]) {
    if(storageError) return false;
    try { localStorage.setItem(storageKey, JSON.stringify(rows)); setProducts(rows); setError(""); return true; }
    catch { setError("Không lưu được bản nháp. Bộ nhớ trình duyệt có thể đã đầy; hãy giảm số ảnh hoặc xuất dữ liệu để giữ thay đổi."); return false; }
  }
  function save(p: AdminProduct) {
    if(products.some(row => row.id !== p.id && (row.code.toLowerCase() === p.code.toLowerCase() || row.slug === p.slug))) { setError("Mã trang phục hoặc đường dẫn đã tồn tại. Vui lòng dùng giá trị khác."); return false; }
    return persist(products.some(row => row.id === p.id) ? products.map(row => row.id === p.id ? p : row) : [...products, p]);
  }
  function duplicate(p: AdminProduct) { const suffix = crypto.randomUUID().slice(0, 8); const copy = { ...p, id: crypto.randomUUID(), code: `${p.code}-${suffix}`, slug: `${p.slug}-${suffix}`, name: `${p.name} (bản sao)`, published: false, calendar: {}, rentalCount: 0, likes: 0, rating: 0, reviewCount: 0 }; if(persist([...products, copy])) setEditing(copy); }
  function remove(ids: string[]) { if(window.confirm(`Xóa ${ids.length} trang phục khỏi bản nháp trên trình duyệt?`)) { if(persist(products.filter(row => !ids.includes(row.id)))) setSelected([]); } }
  function exportData() { const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "thanh-y-cac-trang-phuc.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  const filtered = products.filter(p => `${p.name} ${p.code}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")) && (!category || p.category === category) && (!status || p.status === status) && (!price || (price === "low" ? p.price < 300000 : price === "mid" ? p.price >= 300000 && p.price <= 500000 : p.price > 500000)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const headerTitle = editing
    ? products.some(product => product.id === editing.id) ? "Chỉnh sửa trang phục" : "Thêm trang phục"
    : editor ? "Chỉnh sửa trang phục" : "Quản lý trang phục";
  return <AdminShell title={headerTitle}>{error && <p role="alert" className="mb-5 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    {!loaded ? <p role="status" className="py-20 text-center">Đang tải trang phục...</p> : editing ? <ProductEditor key={editing.id} initial={editing} save={save} back={() => { if(window.confirm("Trở về danh sách? Các thay đổi chưa lưu sẽ bị mất.")) { setEditing(null); if(editor) window.history.replaceState(null, "", "/admin/trang-phuc"); } }} /> : <>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{["Tổng trang phục", ...statuses].map((label, i) => { const count = i ? products.filter(p => p.status === statuses[i - 1]).length : products.length; return <div key={label} className="flex items-start gap-5 rounded-lg border border-[#e7e6e9] bg-white p-5"><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${i === 1 ? "bg-green-50 text-green-800" : i === 2 ? "bg-orange-50 text-orange-800" : "bg-[#fbefef] text-[#80151c]"}`}><Icon name={i === 2 ? "calendar" : i === 1 ? "shield" : "hanger"} className="!h-7 !w-7" /></span><div><p className="text-sm">{label}</p><strong className="mt-2 block text-3xl text-[#80151c]">{count}</strong><p className="mt-2 text-xs text-[#737784]">{i ? `${products.length ? Math.round(count / products.length * 100) : 0}% tổng số` : "Trong danh sách bản nháp"}</p></div></div>; })}</div>
      <section className="overflow-hidden rounded-lg border border-[#e7e6e9] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 p-5"><h2 className="text-xl font-bold text-[#80151c]">Danh sách trang phục</h2><div className="flex flex-wrap gap-2"><button onClick={exportData} className={buttonStyle}>↓ Xuất dữ liệu</button><button onClick={() => setEditing(blankProduct())} className={primaryStyle}>＋ Thêm trang phục mới</button></div></div>
        <div className="grid gap-3 border-t border-[#efedf0] px-5 py-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1.3fr]"><label className="relative"><span className="sr-only">Tìm trang phục</span><input className={`${inputStyle} !mt-0`} placeholder="Tìm theo tên, mã trang phục..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></label>{[["Danh mục", category, categories, setCategory], ["Tình trạng", status, statuses, setStatus]].map(([label, value, options, setter]) => <select key={String(label)} aria-label={String(label)} className={`${inputStyle} !mt-0`} value={String(value)} onChange={e => { (setter as (v: string) => void)(e.target.value); setPage(1); }}><option value="">Tất cả {String(label).toLowerCase()}</option>{(options as string[]).map(v => <option key={v}>{v}</option>)}</select>)}<select aria-label="Giá thuê" className={`${inputStyle} !mt-0`} value={price} onChange={e => { setPrice(e.target.value); setPage(1); }}><option value="">Giá thuê: Mọi mức giá</option><option value="low">Dưới 300.000đ</option><option value="mid">300.000đ – 500.000đ</option><option value="high">Trên 500.000đ</option></select></div>
        {selected.length > 0 && <div className="flex items-center gap-4 px-5 py-2 text-sm"><span>Đã chọn {selected.length} trang phục</span><button onClick={() => remove(selected)} className="text-red-700 underline">Xóa mục đã chọn</button></div>}
        <div className="overflow-x-auto"><table className="w-full min-w-[1020px] border-collapse text-left text-xs"><thead className="border-y border-[#efedf0] bg-[#faf9f9]"><tr><th className="p-3"><input type="checkbox" aria-label="Chọn tất cả trên trang" checked={visible.length > 0 && visible.every(p => selected.includes(p.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...visible.map(p => p.id)])] : selected.filter(id => !visible.some(p => p.id === id)))} className="accent-[#80151c]" /></th>{["Hình ảnh", "Mã trang phục", "Tên trang phục", "Danh mục", "Giá thuê / 24h", "Đặt cọc", "Tình trạng", "Lượt thuê", "Thao tác"].map(label => <th key={label} className="px-3 py-4 font-medium">{label}</th>)}</tr></thead><tbody>{visible.map(p => <tr key={p.id} className="border-b border-[#efedf0] hover:bg-[#fdfafa]"><td className="p-3"><input aria-label={`Chọn ${p.code}`} type="checkbox" checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(id => id !== p.id))} className="accent-[#80151c]" /></td><td className="px-3 py-2"><Image unoptimized width={640} height={800} src={p.images[0] || "/images/logo2.png"} alt={p.name} className="h-[62px] w-14 rounded object-cover" /></td><td className="whitespace-nowrap px-3">{p.code}</td><td className="max-w-[190px] px-3 text-sm leading-6"><button onClick={() => setEditing(p)} className="text-left hover:text-[#80151c]">{p.name}</button>{!p.published && <span className="block text-[10px] text-[#737784]">Bản nháp · Ẩn</span>}</td><td className="px-3"><span className="whitespace-nowrap rounded bg-[#fceeee] px-3 py-2 text-[#80151c]">{p.category}</span></td><td className="whitespace-nowrap px-3">{money(p.price)}</td><td className="whitespace-nowrap px-3">{money(p.deposit)}</td><td className="px-3"><span className={`whitespace-nowrap rounded px-2 py-2 ${p.status === statuses[0] ? "bg-green-50 text-green-800" : p.status === statuses[1] ? "bg-orange-50 text-orange-800" : "bg-red-50 text-red-800"}`}>● &nbsp;{p.status}</span></td><td className="px-3 text-center">{p.rentalCount}</td><td className="px-3"><div className="flex gap-1"><button className={`${buttonStyle} !px-2`} aria-label={`Sửa ${p.code}`} onClick={() => setEditing(p)}>✎</button><button className={`${buttonStyle} !px-2`} aria-label={`Nhân bản ${p.code}`} onClick={() => duplicate(p)}>⧉</button><button className={`${buttonStyle} !px-2 text-red-700`} aria-label={`Xóa ${p.code}`} onClick={() => remove([p.id])}>×</button></div></td></tr>)}</tbody></table></div>
        {visible.length === 0 && <p className="p-12 text-center text-sm text-[#737784]">Không tìm thấy trang phục phù hợp. Hãy đổi bộ lọc hoặc thêm trang phục mới.</p>}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 text-xs text-[#737784]"><span>Hiển thị {visible.length} trên {filtered.length} kết quả</span><div className="flex items-center gap-2"><button className={`${buttonStyle} !px-3`} aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span className="rounded bg-[#80151c] px-4 py-3 text-white">{currentPage} / {totalPages}</span><button className={`${buttonStyle} !px-3`} aria-label="Trang sau" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>›</button><select aria-label="Số trang phục mỗi trang" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className={`${inputStyle} !ml-3 !mt-0 !w-auto`}>{[6, 12, 24].map(size => <option key={size} value={size}>Hiển thị {size} / trang</option>)}</select></div></div>
      </section>
    </>}
  </AdminShell>;
}

