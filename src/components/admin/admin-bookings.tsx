"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ConfirmDialog from "./confirm-dialog";
import { Icon } from "../icon";
import { paginationItems } from "@/lib/admin-pagination";
import AdminShell, { buttonStyle } from "./admin-shell";
type Booking = {
  checkoutId?: string | null;
  paymentMethod?: string | null;
  paymentState?: string | null;
  paymentCode?: string | null;
  transactionRef?: string | null;
  reviewReason?: string | null;
  onlinePayment?: number | null;
  priceSnapshot?: { total: number; deposit: number; remaining: number; days: number; price: number; extraDay: number; accessoryFee: number } | null;
  id: string;
  productCode: string;
  productName: string;
  productImage?: string | null;
  name: string;
  phone: string;
  start: string;
  end: string;
  height: number | null;
  weight: number | null;
  note: string;
  readAt: string | null;
  createdAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  depositConfirmedAt: string | null;
  returnedAt?: string | null;
};
export default function AdminBookings() {
  const [requestId, setRequestId] = useState("");
  useEffect(() => {
    setRequestId(
      new URLSearchParams(window.location.search).get("requestId") || "",
    );
  }, []);
  const [pageSize, setPageSize] = useState(6);
  const [summary, setSummary] = useState<{ total: number; deposited: number; cancelled: number } | null>(null);
  const [data, setData] = useState<Booking[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const r = await fetch(
          `/api/admin/rental-requests?page=${page}&pageSize=${pageSize}&requestId=${encodeURIComponent(requestId)}`,
          { cache: "no-store" },
        );
        if (!r.ok)
          throw Error(
            "Không tải được yêu cầu thuê. Hãy thử lại hoặc đăng nhập lại.",
          );
        const result = await r.json();
        if (active) {
          setData(result.data);
          setTotal(result.total);
          setSummary(result.summary);
          setPage(result.page);
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    setLoading(true);
    void load();
    const timer = setInterval(load, 15000);
    window.addEventListener("rental-requests-updated", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("rental-requests-updated", load);
    };
  }, [page, pageSize, requestId]);
  async function markRead(id: string) {
    try {
      const r = await fetch("/api/admin/rental-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) throw Error();
      setData((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      window.dispatchEvent(new Event("rental-requests-updated"));
    } catch {
      setError("Chưa đánh dấu được yêu cầu. Vui lòng thử lại.");
    }
  }
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    item: Booking;
    action: "confirm" | "cancel" | "return";
  } | null>(null);
  const [confirmationError, setConfirmationError] = useState("");
  const [closedOrder, setClosedOrder] = useState<Booking | null>(null);
  async function updateStatus(item: Booking, action: "confirm" | "cancel" | "return") {
    if (busy) return;
    setBusy(item.id);
    setConfirmationError("");
    try {
      const r = await fetch("/api/admin/rental-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Chưa cập nhật được yêu cầu.");
      setData((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status: action === "confirm" ? "confirmed" : action === "return" ? "completed" : "cancelled",
                returnedAt: result.data?.returnedAt ?? row.returnedAt,
                readAt: row.readAt ?? new Date().toISOString(),
              }
            : row,
        ),
      );
      window.dispatchEvent(new Event("rental-requests-updated"));
      setConfirmation(null);
      if (action === "confirm") setClosedOrder(item);
    } catch (e) {
      setConfirmationError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  const date = (value: string) => value.split("-").reverse().join("/");
  return (
    <AdminShell title="Đặt lịch thuê" actions={<Link href="/admin/dat-lich/tao-don/" className={`${buttonStyle} !bg-[#80151c] border !border-[#b8872e] !text-white`}>+ Tạo đơn thuê</Link>}>
      <section aria-label="Thống kê đơn thuê" className="mb-5 grid gap-4 sm:grid-cols-3">
        {([
          { key: "total", label: "Tổng số đơn", icon: "orders", tone: "bg-[#fcf0ed] text-[#80151c]" },
          { key: "deposited", label: "Đơn đã cọc", icon: "orderConfirmed", tone: "bg-green-50 text-green-700" },
          { key: "cancelled", label: "Đơn đã hủy", icon: "orderCancelled", tone: "bg-red-50 text-red-700" },
        ] as const).map(item => <div key={item.key} className="flex items-center gap-4 rounded-md border border-[#e7e6e9] bg-white p-5">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.tone}`}><Icon name={item.icon} className="!h-6 !w-6" /></span>
          <div><p className="text-sm text-[#61575c]">{item.label}</p><p className="mt-1 text-3xl font-semibold text-[#80151c]">{summary ? summary[item.key].toLocaleString("vi-VN") : "—"}</p></div>
        </div>)}
      </section>
      <ConfirmDialog
        appearance={confirmation?.action === "confirm" ? "transaction" : "default"}
        open={confirmation !== null}
        title={
          confirmation?.action === "confirm"
            ? "Xác nhận đã nhận cọc?"
            : confirmation?.action === "return" ? "Xác nhận đã nhận lại đồ?" : "Hủy yêu cầu thuê?"
        }
        description={
          confirmation
            ? confirmation.action === "confirm"
              ? `Xác nhận đã nhận cọc cho ${confirmation.item.productCode} của ${confirmation.item.name}. Hệ thống sẽ giữ lịch từ ${date(confirmation.item.start)} đến ${date(confirmation.item.end)}, bao gồm cả ngày trả.`
              : confirmation.action === "return" ? "Hoàn tất đơn và mở lại lịch còn lại để bộ trang phục có thể cho thuê ngay." : `Hủy yêu cầu thuê ${confirmation.item.productCode} của ${confirmation.item.name} và giải phóng lịch. Việc hoàn cọc cần được xử lý riêng.`
            : ""
        }
        confirmLabel={
          confirmation?.action === "confirm"
            ? "Xác nhận cọc & giữ lịch"
            : confirmation?.action === "return" ? "Đã nhận lại đồ" : "Hủy yêu cầu"
        }
        cancelLabel="Quay lại"
        tone={confirmation?.action !== "cancel" ? "primary" : "danger"}
        busy={busy !== null}
        error={confirmationError}
        onCancel={() => {
          if (!busy) setConfirmation(null);
        }}
        onConfirm={() => {
          if (confirmation)
            void updateStatus(confirmation.item, confirmation.action);
        }}
      />
      <ConfirmDialog
        open={closedOrder !== null}
        appearance="transaction"
        completed
        tone="primary"
        title="Chốt đơn thành công"
        description={closedOrder ? `Đã xác nhận cọc và giữ lịch ${closedOrder.productCode} cho ${closedOrder.name}, từ ${date(closedOrder.start)} đến ${date(closedOrder.end)}.` : ""}
        confirmLabel="Hoàn tất"
        onConfirm={() => setClosedOrder(null)}
        onCancel={() => setClosedOrder(null)}
      />
      {requestId && (
        <a
          href="/admin/dat-lich"
          className="mb-4 inline-flex min-h-10 items-center text-sm font-semibold text-[#781216] underline"
        >
          Xem tất cả yêu cầu thuê
        </a>
      )}
      {error && (
        <p role="alert" className="mb-4 text-red-800">
          {error}
        </p>
      )}
      {loading ? (
        <p>Đang tải…</p>
      ) : !data.length ? (
        <p>Chưa có yêu cầu đặt thuê.</p>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <article
              key={item.id}
              className="relative rounded-md border border-stone-200 bg-white p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between xl:block">
              <dl className="grid min-w-0 flex-1 gap-4 text-sm sm:grid-cols-2 xl:[&>div:nth-child(even)]:pr-44">
                <div>
                  <dt className="font-medium text-[#9a6d16]">Khách hàng</dt>
                  <dd>
                    {item.name} ·{" "}
                    <a className="underline" href={`tel:${item.phone}`}>
                      {item.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[#9a6d16]">Ngày nhận — trả</dt>
                  <dd>
                    {date(item.start)} — {date(item.end)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[#9a6d16]">Số đo</dt>
                  <dd>
                    {item.height ?? "—"} cm · {item.weight ?? "—"} kg
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[#9a6d16]">Ghi chú</dt>
                  <dd className="whitespace-pre-wrap break-words">
                    {item.note || "Không có"}
                  </dd>
                </div>
              </dl>
                {!item.readAt && (
                  <button
                    className={`${buttonStyle} shrink-0 self-end sm:self-start xl:absolute xl:right-5 xl:top-5`}
                    onClick={() => markRead(item.id)}
                  >
                    Đánh dấu đã xem
                  </button>
                )}
              </div>
              <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
                <div className="flex min-w-0 items-start gap-4">
                  {item.productImage && <Image unoptimized src={item.productImage} alt={item.productName} width={96} height={120} className="h-[120px] w-24 shrink-0 rounded-[2px] bg-stone-50 object-contain" />}
                  <div className="min-w-0">
                  <h2 className="font-semibold">
                    {item.productCode} · {item.productName}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(item.createdAt).toLocaleString("vi-VN")} ·{" "}
                    {item.readAt ? "Đã xem" : "Yêu cầu mới"}
                  </p>
                  </div>
                </div>
                {item.priceSnapshot ? <div className="rounded-[2px] bg-stone-50 p-3 text-sm">
                  <p>Tổng tiền thuê: <strong>{item.priceSnapshot.total.toLocaleString("vi-VN")}đ</strong> · {item.priceSnapshot.days} ngày</p>
                  <p>{item.depositConfirmedAt ? "Cọc đã xác nhận" : "Cọc giữ lịch dự kiến"}: {item.priceSnapshot.deposit.toLocaleString("vi-VN")}đ</p>
                  <p>{item.depositConfirmedAt ? "Còn thanh toán" : "Còn thanh toán sau khi cọc"}: {item.priceSnapshot.remaining.toLocaleString("vi-VN")}đ</p>
                  {item.checkoutId && <div className="mt-2 border-t border-stone-200 pt-2 text-xs text-stone-500"><p>{item.onlinePayment ? "Cọc qua payOS" : "Cửa hàng xác nhận"} · Nội dung: TYC {item.paymentCode}</p>{item.onlinePayment && item.status === "pending" && <p className="mt-1">Chờ giao dịch được xác minh; hệ thống tự chốt khi nhận tiền hợp lệ.</p>}{item.transactionRef && <p className="mt-1">Mã giao dịch: {item.transactionRef}</p>}{item.reviewReason && <p className="mt-1 font-medium text-amber-800">{item.reviewReason}</p>}</div>}
                </div> : <p className="text-xs text-stone-500">Đơn cũ chưa có bảng giá lưu. Liên hệ khách để đối chiếu.</p>}

              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
                {item.status !== "pending" && <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-sm font-semibold ${item.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : item.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-stone-100 text-stone-700"}`}
                >
                  {item.status === "confirmed"
                    ? "Đã nhận cọc · Đã khóa lịch"
                    : item.status === "cancelled"
                      ? "Đã hủy"
                      : item.status === "completed" ? "Đã nhận lại đồ" : ""}
                </span>}
                {item.status === "pending" && !item.onlinePayment && (
                  <button
                    disabled={busy !== null}
                    className={`${buttonStyle} !border-[#b8872e] !bg-[#781216] border !border-[#b8872e] !text-white hover:!border-[#d4a84b]`}
                    onClick={() => {
                      setConfirmationError("");
                      setConfirmation({ item, action: "confirm" });
                    }}
                  >
                    Xác nhận đã nhận cọc & giữ lịch
                  </button>
                )}
                {item.returnedAt && <span className="text-xs text-stone-500">Nhận lại: {new Date(item.returnedAt).toLocaleString("vi-VN")}</span>}
                {item.status === "confirmed" && <button disabled={busy !== null} className={`${buttonStyle} !bg-[#781216] border !border-[#b8872e] !text-white`} onClick={() => { setConfirmationError(""); setConfirmation({ item, action: "return" }); }}>Đã nhận lại đồ</button>}
                {(item.status === "pending" || item.status === "confirmed") && (
                  <button
                    disabled={busy !== null}
                    className={buttonStyle}
                    onClick={() => {
                      setConfirmationError("");
                      setConfirmation({ item, action: "cancel" });
                    }}
                  >
                    Hủy yêu cầu
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-md border border-[#e8e4e7] bg-white px-5 py-5">
        <p aria-live="polite" className="text-xs text-[#827b80]">
          {loading
            ? "Đang tải kết quả…"
            : `Hiển thị ${data.length} trên ${total} kết quả`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <nav
            aria-label="Phân trang yêu cầu thuê"
            className="flex items-center gap-2"
          >
            <button
              type="button"
              aria-label="Trang trước"
              disabled={loading || page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e7d5d1] text-[#781216] transition hover:bg-[#fcf0ed] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Icon name="chevron" className="!h-4 !w-4 rotate-180" />
            </button>
            {paginationItems(
              page,
              Math.max(1, Math.ceil(total / pageSize)),
            ).map((item, index) =>
              item === "ellipsis" ? (
                <span key={`gap-${index}`} className="px-1 text-stone-500">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-label={`Trang ${item}`}
                  aria-current={page === item ? "page" : undefined}
                  disabled={loading}
                  onClick={() => setPage(item)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm transition disabled:opacity-50 ${page === item ? "border-[#781216] bg-[#781216] border !border-[#b8872e] font-semibold text-white" : "border-[#e7d5d1] text-[#34343e] hover:bg-[#fcf0ed]"}`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              aria-label="Trang sau"
              disabled={loading || page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e7d5d1] text-[#781216] transition hover:bg-[#fcf0ed] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Icon name="chevron" className="!h-4 !w-4" />
            </button>
          </nav>
          <div className="relative">
            <select
              aria-label="Số yêu cầu mỗi trang"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-11 appearance-none rounded-lg border border-[#ded7da] bg-white pl-4 pr-10 text-sm text-[#34343e] focus-visible:outline-[#781216]"
            >
              {[6, 12, 20, 50].map((size) => (
                <option key={size} value={size}>
                  Hiển thị {size} / trang
                </option>
              ))}
            </select>
            <Icon
              name="chevron"
              className="pointer-events-none absolute right-3 top-1/2 !h-3.5 !w-3.5 -translate-y-1/2 rotate-90 text-[#781216]"
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
