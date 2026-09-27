"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell, {
  buttonStyle,
  inputStyle,
  primaryStyle,
} from "./admin-shell";
import ConfirmDialog from "./confirm-dialog";
import { Icon } from "../icon";
import type { AdminCategory } from "@/lib/admin-categories";

const empty = { slug: "", name: "", codePrefix: "", position: 0 };
const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
async function request(method = "GET", data?: object) {
  const response = await fetch("/api/admin/categories", {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error?.message || "Không tải được danh mục.");
  return body.data as AdminCategory[];
}
export default function AdminCategories() {
  const [rows, setRows] = useState<AdminCategory[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [settling, setSettling] = useState(false);
  const drag = useRef<{ source: string; target: string; y: number; height: number; centers: { slug: string; y: number }[] } | null>(null);
  function beginDrag(event: React.PointerEvent<HTMLButtonElement>, source: string) {
    if (event.button !== 0 || settling || busy) return;
    const element = event.currentTarget.closest("tr")!;
    const rect = element.getBoundingClientRect();
    drag.current = { source, target: source, y: event.clientY, height: rect.height,
      centers: Array.from(element.parentElement!.querySelectorAll("tr")).map(row => ({ slug: row.dataset.categorySlug!, y: row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2 })) };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(source); setDropTarget(source); setOffset(0);
  }
  function updateDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || settling) return;
    const sourceY = active.centers.find(row => row.slug === active.source)!.y;
    const center = Math.max(active.centers[0].y, Math.min(active.centers.at(-1)!.y, sourceY + event.clientY - active.y));
    const closest = active.centers.reduce((a, b) => Math.abs(a.y - center) < Math.abs(b.y - center) ? a : b);
    active.target = closest.slug;
    setOffset(center - sourceY); setDropTarget(closest.slug);
  }
  async function endDrag(cancel = false) {
    const active = drag.current;
    if (!active || settling) return;
    setSettling(true);
    const target = cancel ? active.source : active.target;
    const destination = active.centers.find(row => row.slug === target)!.y;
    setOffset(destination - active.centers.find(row => row.slug === active.source)!.y);
    if (cancel) setDropTarget(active.source);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) await new Promise(resolve => setTimeout(resolve, 180));
    drag.current = null; setDragging(null); setDropTarget(null); setOffset(0); setSettling(false);
    if (!cancel) void move(active.source, target);
  }
  function rowOffset(slug: string) {
    if (!dragging || !dropTarget) return 0;
    if (slug === dragging) return offset;
    const from = rows.findIndex(row => row.slug === dragging), to = rows.findIndex(row => row.slug === dropTarget), index = rows.findIndex(row => row.slug === slug);
    const height = drag.current?.height || 0;
    return from < to && index > from && index <= to ? -height : from > to && index >= to && index < from ? height : 0;
  }
  async function move(source: string, target: string) {
    if (busy || source === target || query) return;
    const next = [...rows];
    const from = next.findIndex(row => row.slug === source);
    const to = next.findIndex(row => row.slug === target);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    setRows(next);
    setBusy(true); setError(""); setMessage("");
    try {
      await request("PATCH", { order: next.map(row => row.slug) });
      setRows(await request());
      setMessage("Đã lưu thứ tự danh mục.");
    } catch (cause) { setRows(rows); setError(cause instanceof Error ? cause.message : "Không lưu được thứ tự."); }
    finally { setBusy(false); }
  }
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  async function load() {
    setLoading(true);
    try {
      setRows(await request());
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không tải được danh mục.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function mutate(method: string, data: object) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request(method, data);
      setRows(await request());
      setForm(empty);
      setEditing(false);
      setDeleting(null);
      setMessage(method === "DELETE" ? "Đã xóa danh mục." : "Đã lưu danh mục.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không lưu được danh mục.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminShell title="Quản lý danh mục">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void load()}
          >
            Thử lại
          </button>
        </div>
      )}
      {message && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-lg border border-[#e7e6e9] bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-[#80151c]">
            Danh mục ({rows.length})
          </h2>
          <input
            aria-label="Tìm danh mục"
            className={inputStyle}
            placeholder="Tìm danh mục…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading ? (
            <p role="status" className="py-12 text-center">
              Đang tải danh mục…
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-[#faf9f9]">
                  <tr>
                    {[
                      "Tên danh mục",
                      "Tiền tố",
                      "Trang phục",
                      "Thao tác",
                    ].map((title) => (
                      <th className="p-3 font-medium" key={title}>
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((row) =>
                      row.name
                        .toLocaleLowerCase("vi")
                        .includes(query.toLocaleLowerCase("vi")),
                    )
                    .map((row) => (
                      <tr key={row.slug} data-category-slug={row.slug}
                        style={{ transform: `translateY(${rowOffset(row.slug)}px)`, position: "relative", zIndex: dragging === row.slug ? 10 : 0, transition: dragging === row.slug && !settling ? "none" : dragging ? "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none" }}
                        className={`border-b border-[#efedf0] motion-reduce:!transition-none ${dragging === row.slug ? "bg-[#fff8f5] shadow-[0_6px_20px_-5px_rgba(70,20,25,0.25)] ring-1 ring-[#80151c]/20" : "bg-white"}`}>
                        <td className="p-3 font-medium">
                          {row.name}
                          <span className="mt-1 block text-xs font-normal text-[#737784]">
                            {row.slug}
                          </span>
                        </td>
                        <td className="p-3">TYC-{row.codePrefix}</td>
                        <td className="p-3">{row.productCount}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                          <button type="button" disabled={busy || Boolean(query)} aria-label={`Kéo sắp xếp ${row.name}`} title={query ? "Xóa tìm kiếm để sắp xếp" : "Kéo để sắp xếp; dùng phím ↑ ↓ để di chuyển"}
                            className="flex h-10 w-10 touch-none items-center justify-center rounded border border-[#e7e6e9] text-xl text-[#737784] hover:bg-[#fceeee] disabled:opacity-40 cursor-grab active:cursor-grabbing"
                            onPointerDown={e => beginDrag(e, row.slug)}
                            onPointerMove={updateDrag}
                            onPointerUp={() => void endDrag()}
                            onPointerCancel={() => void endDrag(true)}
                            onKeyDown={e => { if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return; e.preventDefault(); const target = rows[rows.findIndex(item => item.slug === row.slug) + (e.key === "ArrowUp" ? -1 : 1)]; if (target) void move(row.slug, target.slug); }}
                          ><span aria-hidden="true">⠿</span></button>
                            <button
                              type="button"
                              disabled={busy}
                              title="Chỉnh sửa danh mục"
                              aria-label={`Chỉnh sửa ${row.name}`}
                              className={`${buttonStyle} inline-flex !h-10 !w-10 items-center justify-center !p-0`}
                              onClick={() => {
                                setForm({
                                  slug: row.slug,
                                  name: row.name,
                                  codePrefix: row.codePrefix || "",
                                  position: Number(row.position),
                                });
                                setEditing(true);
                              }}
                            >
                              <Icon name="edit" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Xóa ${row.name}`}
                              className={`${buttonStyle} inline-flex !h-10 !w-10 items-center justify-center !p-0 text-[#b52222]`}
                              disabled={busy || Number(row.productCount) > 0}
                              title={
                                Number(row.productCount) > 0
                                  ? "Chuyển trang phục sang danh mục khác trước khi xóa"
                                  : "Xóa danh mục"
                              }
                              onClick={() => {
                                setError("");
                                setDeleting(row);
                              }}
                            >
                              <Icon name="trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!rows.length && (
                <p className="py-12 text-center">Chưa có danh mục.</p>
              )}
            </div>
          )}
        </section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void mutate(editing ? "PATCH" : "POST", form);
          }}
          className="rounded-lg border border-[#e7e6e9] bg-white p-5"
        >
          <h2 className="mb-5 text-lg font-semibold text-[#80151c]">
            {editing ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          </h2>
          <fieldset disabled={busy || loading} className="space-y-4">
            <label className="block text-sm">
              Tên danh mục
              <input
                required
                maxLength={191}
                className={inputStyle}
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    ...(!editing ? { slug: slugify(e.target.value) } : {}),
                  })
                }
              />
            </label>
            <label className="block text-sm">
              Đường dẫn
              <input
                required
                readOnly={editing}
                maxLength={80}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={inputStyle}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Tiền tố mã
              <input
                required
                maxLength={10}
                pattern="[A-Za-z]{2,10}"
                placeholder="VD: CD"
                className={inputStyle}
                value={form.codePrefix}
                onChange={(e) =>
                  setForm({ ...form, codePrefix: e.target.value.toUpperCase() })
                }
              />
              <span className="mt-2 block text-xs text-[#737784]">
                Ví dụ: TYC-{form.codePrefix || "CD"}01. Chỉ áp dụng cho mã tạo
                mới.
              </span>
            </label>
            <div className="flex gap-2">
              <button className={primaryStyle}>
                {busy
                  ? "Đang lưu…"
                  : editing
                    ? "Lưu thay đổi"
                    : "Thêm danh mục"}
              </button>
              {editing && (
                <button
                  type="button"
                  className={buttonStyle}
                  onClick={() => {
                    setForm(empty);
                    setEditing(false);
                  }}
                >
                  Hủy
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </div>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa danh mục?"
        description={`Bạn muốn xóa danh mục “${deleting?.name || ""}”?`}
        busy={busy}
        error={error || undefined}
        confirmLabel="Xóa danh mục"
        onConfirm={() => {
          if (deleting) void mutate("DELETE", { slug: deleting.slug });
        }}
        onCancel={() => {
          if (!busy) setDeleting(null);
        }}
      />
    </AdminShell>
  );
}
