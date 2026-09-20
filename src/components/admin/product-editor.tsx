"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AdminProduct } from "@/lib/admin-products";
import { categories, statuses, money } from "@/lib/admin-products";
import { buttonStyle, primaryStyle, inputStyle } from "./admin-shell";

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-[#e7e6e9] bg-white p-5 ${className}`}><h2 className="mb-4 text-lg font-semibold text-[#80151c]">{title}</h2>{children}</section>;
}

export default function ProductEditor({ initial, save, back }: { initial: AdminProduct; save: (product: AdminProduct) => boolean; back: () => void }) {
  const [p, setP] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const dirty = JSON.stringify(p) !== saved;
  useEffect(() => {
    if(!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const navigate = (event: MouseEvent) => {
      if(event.target instanceof Element && event.target.closest("a[href]") && !window.confirm("Rời trang? Các thay đổi chưa lưu sẽ bị mất.")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
  const [message, setMessage] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dayStatus, setDayStatus] = useState("Đã đặt");
  const preview = useRef<HTMLDialogElement>(null);
  const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) => setP(old => ({ ...old, [key]: value }));
  function field(key: keyof AdminProduct, label: string, options: { type?: string; required?: boolean; area?: boolean; values?: string[]; max?: number } = {}) {
    const props = { className: inputStyle, required: options.required, value: String(p[key]), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, options.type === "number" ? Number(e.target.value) : e.target.value) };
    return <label className="block text-xs leading-5 text-[#616371]">{label}{options.required && <span className="text-[#80151c]"> *</span>}{options.values ? <select {...props}>{options.values.map(v => <option key={v}>{v}</option>)}</select> : options.area ? <textarea {...props} rows={3} maxLength={options.max} /> : <input {...props} type={options.type || "text"} min={options.type === "number" ? 0 : undefined} max={options.max} step={key === "rating" ? "0.1" : undefined} />}</label>;
  }
  async function upload(files: FileList | null) {
    if(!files) return;
    const selected = Array.from(files);
    if(selected.length + p.images.length > 8 || selected.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 750000)) { setMessage("Chọn tối đa 8 ảnh JPG, PNG hoặc WebP; mỗi ảnh không quá 750 KB."); return; }
    try {
      const images = await Promise.all(selected.map(file => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); })));
      setP(old => ({ ...old, images: [...old.images, ...images] })); setMessage("");
    } catch { setMessage("Không đọc được ảnh. Vui lòng chọn lại."); }
  }
  function submit(draft = false) {
    if(p.minHeight > p.maxHeight || p.minWeight > p.maxWeight) { setMessage("Kích thước tối thiểu không được lớn hơn tối đa."); return; }
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) { setMessage("Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang."); return; }
    if(!p.images.length) { setMessage("Vui lòng thêm ít nhất một ảnh trang phục."); return; }
    const updated = { ...p, published: draft ? false : p.published };
    if(save(updated)) {
      setP(updated); setSaved(JSON.stringify(updated));
      setMessage(draft ? "Đã lưu bản nháp trên trình duyệt." : "Đã lưu thay đổi trên trình duyệt.");
    }
  }
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return <form onSubmit={e => { e.preventDefault(); submit(); }}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#19191b]">{initial.code ? "Chỉnh sửa trang phục" : "Thêm trang phục mới"}</h1><p className="mt-2 text-sm text-[#737784]">Cập nhật thông tin, hình ảnh và lịch thuê của trang phục</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={back} className={buttonStyle}>← Quay lại</button><button type="submit" onClick={e => { if(e.currentTarget.form?.checkValidity()) { e.preventDefault(); submit(true); } }} className={buttonStyle}>Lưu nháp</button><button type="button" onClick={() => preview.current?.showModal()} className={buttonStyle}>Xem trước</button><button className={primaryStyle}>✓ Lưu thay đổi</button></div></div>
    {message && <p role="status" className="mb-4 rounded border border-[#dbcbb8] bg-[#fff9ed] p-3 text-sm">{message}</p>}
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Section title="Hình ảnh trang phục"><div className="grid grid-cols-[1.7fr_1fr] gap-4"><div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-md bg-[#f7f2ee]">{p.images[0] ? <Image unoptimized width={640} height={800} src={p.images[0]} alt="Ảnh đại diện trang phục" className="h-[320px] w-full object-cover" /> : <span className="text-sm text-[#737784]">Chưa có ảnh đại diện</span>}<span className="absolute bottom-3 left-3 rounded bg-white px-3 py-2 text-xs text-[#80151c]">Ảnh đại diện</span></div><div className="grid content-start grid-cols-2 gap-2">{p.images.map((src, i) => <div key={`${i}-${src.slice(0, 30)}`} className="relative"><button type="button" aria-label={`Dùng ảnh ${i + 1} làm đại diện`} onClick={() => set("images", [src, ...p.images.filter((_, index) => index !== i)])} className={`h-20 w-full overflow-hidden rounded border-2 ${i === 0 ? "border-[#80151c]" : "border-transparent"}`}><Image unoptimized width={640} height={800} src={src} alt={`Trang phục ${i + 1}`} className="h-full w-full object-cover" /></button><button type="button" onClick={() => set("images", p.images.filter((_, index) => index !== i))} aria-label={`Xóa ảnh ${i + 1}`} className="absolute right-0 top-0 rounded bg-white px-1 text-[#80151c]">×</button></div>)}<label className="relative flex h-24 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#cccbd1] text-xs text-[#737784]"><span className="mb-2 text-2xl text-[#80151c]">+</span>Thêm ảnh<input aria-label="Thêm ảnh trang phục" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e => { void upload(e.target.files); e.target.value = ""; }} className="absolute inset-0 w-full cursor-pointer opacity-0" /></label></div></div><p className="mt-3 text-xs text-[#737784]">Chọn ảnh nhỏ để đặt làm đại diện. Tối đa 8 ảnh, 750 KB/ảnh.</p></Section>
      <Section title="Thông tin cơ bản"><div className="grid gap-3 sm:grid-cols-2">{field("code", "Mã trang phục", { required: true })}{field("name", "Tên trang phục", { required: true })}{field("category", "Danh mục", { values: categories })}{field("status", "Tình trạng", { values: statuses })}<div className="sm:col-span-2">{field("description", "Mô tả ngắn", { area: true, required: true, max: 300 })}<p className="text-right text-xs text-[#737784]">{p.description.length}/300</p></div>{field("tags", "Nhãn / Tags (phân cách bằng dấu phẩy)")}{field("gender", "Giới tính", { values: ["Nữ", "Nam", "Unisex"] })}{field("slug", "Đường dẫn (slug)", { required: true })}{field("badge", "Nhãn trên ảnh")}</div></Section>
      <Section title="Giá thuê & đặt cọc"><div className="grid gap-3 sm:grid-cols-3">{field("price", "Giá thuê / 24h (đ)", { type: "number", required: true })}{field("extraDay", "Phụ thu / ngày tiếp (đ)", { type: "number" })}{field("deposit", "Tiền đặt cọc (đ)", { type: "number", required: true })}</div><div className="mt-3 grid gap-3 sm:grid-cols-2">{field("accessoryFee", "Phí phụ kiện (đ)", { type: "number" })}{field("offer", "Ưu đãi / ghi chú")}</div></Section>
      <Section title="Thông số kỹ thuật & kích thước"><div className="grid grid-cols-2 gap-3">{field("minHeight", "Chiều cao từ (cm)", { type: "number", required: true })}{field("maxHeight", "Chiều cao đến (cm)", { type: "number", required: true })}{field("minWeight", "Cân nặng từ (kg)", { type: "number", required: true })}{field("maxWeight", "Cân nặng đến (kg)", { type: "number", required: true })}{field("material", "Chất liệu")}{field("accessories", "Phụ kiện đi kèm")}</div><div className="mt-3">{field("fitNote", "Ghi chú điều chỉnh kích thước")}</div></Section>
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr_0.8fr]">
      <Section title="Trọn bộ trang phục gồm">{field("components", "Mỗi dòng là một thành phần trong bộ", { area: true })}<ul className="mt-4 space-y-2 text-sm">{p.components.split("\n").filter(Boolean).map((text, i) => <li key={i} className="flex gap-2"><span className="text-[#80151c]">☑</span>{text}</li>)}</ul></Section>
      <Section title="Lịch thuê"><div className="mb-3 flex items-center justify-between"><button type="button" className={buttonStyle} aria-label="Tháng trước" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><strong className="text-sm">Tháng {month.getMonth() + 1} / {month.getFullYear()}</strong><button type="button" className={buttonStyle} aria-label="Tháng sau" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div><label className="text-xs">Trạng thái khi chọn ngày<select className={inputStyle} value={dayStatus} onChange={e => setDayStatus(e.target.value)}>{["Có thể thuê", "Đã đặt", "Không khả dụng"].map(v => <option key={v}>{v}</option>)}</select></label><div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(v => <span key={v} className="py-1 text-[#737784]">{v}</span>)}{Array.from({ length: offset }, (_, i) => <span key={`blank${i}`} />)}{Array.from({ length: days }, (_, i) => { const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`; const state = p.calendar[date] || "Có thể thuê"; return <button type="button" key={date} aria-label={`${date}: ${state}`} title={`${date}: ${state}`} onClick={() => { const next = { ...p.calendar }; if(dayStatus === "Có thể thuê") delete next[date]; else next[date] = dayStatus; set("calendar", next); }} className={`rounded py-2 ${state === "Đã đặt" ? "bg-amber-100 text-amber-900" : state === "Không khả dụng" ? "bg-red-100 text-red-900" : "bg-green-50 text-green-900"}`}>{i + 1}</button>; })}</div><p className="mt-3 text-[11px] text-[#616371]">Xanh: có thể thuê · Vàng: đã đặt · Đỏ: không khả dụng</p></Section>
      <Section title="Hiển thị & tùy chọn"><div className="space-y-5">{([["published", "Hiển thị trên website"], ["featured", "Nổi bật trong danh mục"], ["onlineBooking", "Cho phép đặt lịch trực tuyến"], ["showLikes", "Hiển thị số lượt thích"]] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 text-sm">{label}<input type="checkbox" role="switch" checked={p[key]} onChange={e => set(key, e.target.checked)} className="h-5 w-9 shrink-0 accent-[#80151c]" /></label>)}</div><p className="mt-6 text-xs leading-5 text-[#737784]">Các tùy chọn đang được lưu trong bản nháp, chưa tác động đến website.</p></Section>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><Section title="Nội dung chi tiết & bộ sưu tập">{field("details", "Mô tả chi tiết", { area: true })}<div className="mt-3">{field("collection", "Bộ sưu tập đề xuất")}</div><div className="mt-3 grid grid-cols-2 gap-3">{field("rentalCount", "Lượt thuê", { type: "number" })}{field("likes", "Lượt yêu thích", { type: "number" })}{field("rating", "Điểm đánh giá (0–5)", { type: "number", max: 5 })}{field("reviewCount", "Số lượt đánh giá", { type: "number" })}</div></Section><Section title="Chính sách & hướng dẫn bảo quản"><div className="space-y-3">{field("cleaning", "Quy trình giặt hấp / bảo quản", { area: true })}{field("rentalPolicy", "Thời gian thuê, gia hạn & trả đồ", { area: true })}{field("damagePolicy", "Bồi hoàn & trách nhiệm", { area: true })}</div></Section></div>
    <div className="mt-5 flex justify-end border-t border-[#e5e1df] pt-4"><button className={primaryStyle}>✓ Lưu thay đổi</button></div>
    <dialog aria-label="Xem trước nội dung trang phục" ref={preview} className="max-h-[90vh] w-[900px] max-w-[95vw] overflow-auto rounded-lg bg-[#fff8f5] p-6 text-[#563b36] backdrop:bg-black/40"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Xem trước nội dung trang phục</h2><button type="button" className={buttonStyle} onClick={() => preview.current?.close()}>Đóng</button></div><div className="grid gap-6 md:grid-cols-2">{p.images[0] && <Image unoptimized width={640} height={800} src={p.images[0]} alt={p.name} className="max-h-[500px] w-full rounded object-cover" />}<div><p className="text-sm">{p.code} · {p.category}</p><h3 className="mt-3 text-2xl font-bold text-[#80151c]">{p.name}</h3><p className="my-5 text-2xl font-semibold text-[#80151c]">{money(p.price)} <span className="text-sm font-normal">/ 24 giờ</span></p><p className="text-sm leading-7">Đặt cọc: {money(p.deposit)}<br />Ngày tiếp theo: {money(p.extraDay)}<br />Chiều cao: {p.minHeight}–{p.maxHeight} cm<br />Cân nặng: {p.minWeight}–{p.maxWeight} kg<br />Chất liệu: {p.material}<br />Phụ kiện: {p.accessories}</p><p className="mt-5 leading-7">{p.description}</p><p className="mt-4 whitespace-pre-line text-sm leading-7">{p.components}</p></div></div><p className="mt-5 whitespace-pre-line leading-7">{p.details}</p></dialog>
  </form>;
}


