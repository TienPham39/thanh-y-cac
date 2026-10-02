"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "../icon";

type Notice = {
  id: string;
  productCode: string;
  productName: string;
  name: string;
  start: string;
  end: string;
  createdAt: string;
  readAt: string | null;
  status: string;
};
export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState<number | null>(null);
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch(
          open
            ? "/api/admin/rental-requests?pageSize=6"
            : "/api/admin/rental-requests?count=1",
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (active) {
          setUnread(result.unread);
          if (open) setItems(result.data);
          setError(false);
        }
      } catch {
        if (active) {
          setUnread(null);
          setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (open) setLoading(true);
    void refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    window.addEventListener("rental-requests-updated", refresh);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("rental-requests-updated", refresh);
    };
  }, [open, retry]);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const date = (value: string) => value.split("-").reverse().join("/");
  return (
    <div
      ref={root}
      className="relative ml-auto shrink-0"
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={
          unread === null
            ? "Thông báo thuê"
            : `Thông báo: ${unread} yêu cầu thuê mới`
        }
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-[#000000] transition-colors hover:bg-[#781216]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#781216] ${open ? "bg-[#781216]/10" : "bg-stone-50"}`}
      >
        <Icon name="bell" className="!h-6 !w-6" />
        {unread !== null && unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#781216] px-1 text-[10px] font-bold text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        {error && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 rounded-full bg-amber-100 px-1 text-xs text-amber-800"
          >
            !
          </span>
        )}
      </button>
      {open && (
        <div
          ref={panel}
          id={id}
          role="region"
          aria-label="Thông báo đặt thuê"
          tabIndex={-1}
          className="absolute right-0 top-full z-50 mt-3 flex max-h-[calc(100dvh-100px)] w-[min(384px,calc(100vw-40px))] flex-col overflow-hidden rounded-xl border border-[#ded7d2] bg-white shadow-[0_12px_30px_rgba(40,20,20,0.12)] focus:outline-none"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e8e1dc] px-4 py-3">
            <h2 className="text-sm font-semibold">Thông báo</h2>
            <span className="text-xs text-[#781216]">
              {unread === null ? "Chưa kết nối" : `${unread} chưa đọc`}
            </span>
          </div>
          <div
            className="max-h-96 min-h-0 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#781216] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button]:h-0 [&::-webkit-scrollbar-button]:w-0"
            aria-busy={loading}
          >
            {loading ? (
              <p className="p-5 text-sm text-stone-500">Đang tải thông báo…</p>
            ) : error ? (
              <div className="p-5 text-sm">
                <p role="alert">Chưa tải được thông báo.</p>
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                  className="mt-2 min-h-10 font-semibold text-[#781216] underline"
                >
                  Thử lại
                </button>
              </div>
            ) : !items.length ? (
              <p className="p-5 text-sm text-stone-500">
                Chưa có yêu cầu đặt thuê.
              </p>
            ) : (
              <ul className="divide-y divide-[#e8e1dc]">
                {items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`/admin/dat-lich/?requestId=${encodeURIComponent(item.id)}`}
                      onClick={() => setOpen(false)}
                      className={`block px-4 py-3 transition-colors hover:bg-[#781216]/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#781216] ${item.readAt ? "bg-white" : "bg-[#fff8f6]"}`}
                    >
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-semibold text-[#40383b]">
                        Yêu cầu thuê {item.productCode}
                      </p>
                      {!item.readAt && (
                        <span
                          aria-label="Chưa đọc"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#781216]"
                        />
                      )}
                    </div>
                    <p className="mt-1 break-words text-xs leading-5 text-[#777078]">
                      {item.name} muốn thuê {item.productName} từ{" "}
                      {date(item.start)} đến {date(item.end)}.
                    </p>
                    {item.status !== "pending" && <p className="mt-1 text-xs text-[#781216]">
                      {item.status === "confirmed"
                        ? "Đã nhận cọc · Đã giữ lịch"
                        : item.status === "cancelled"
                          ? "Đã hủy"
                          : "Đã nhận lại đồ"}
                    </p>}
                    <time
                      dateTime={item.createdAt}
                      className="mt-1 block text-[11px] text-[#938a90]"
                    >
                      {new Date(item.createdAt).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </time>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/admin/dat-lich"
            onClick={() => setOpen(false)}
            className="flex min-h-11 shrink-0 items-center justify-center border-t border-[#e8e1dc] px-4 text-sm font-semibold text-[#9a6d16] transition hover:bg-[#fff8ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#781216]"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </div>
  );
}
