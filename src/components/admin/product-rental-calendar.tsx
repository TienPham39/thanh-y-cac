"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  calendarDays,
  formatRentalDate,
  shiftMonth,
  vietnamToday,
} from "@/lib/rental-calendar";
import { Icon } from "../icon";
type Booking = {
  id: string;
  start: string;
  end: string;
  name: string;
  phone: string;
};
export default function ProductRentalCalendar({
  productCode,
}: {
  productCode: string;
}) {
  const today = vietnamToday();
  const [month, setMonth] = useState(() => shiftMonth(today, 0));
  const [rows, setRows] = useState<Booking[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState(today);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState("loading");
    async function load() {
      if (!productCode) return;
      try {
        const response = await fetch(
          "/api/admin/rental-requests?productCode=" +
            encodeURIComponent(productCode),
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw Error();
        const result = await response.json();
        if (active) {
          setRows(result.data);
          setState("ready");
        }
      } catch {
        if (active) setState("error");
      }
    }
    if (productCode) void load();
    else {
      setRows([]);
      setState("ready");
    }
    const timer = setInterval(() => {
      if (productCode) void load();
    }, 15000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [productCode, retry]);
  const matches = rows.filter(
    (row) => row.start <= selected && row.end >= selected,
  );
  const navigation =
    "flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-[#781216] hover:bg-[#fff4f2] focus-visible:outline-[#781216]";
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/admin/dat-lich"
          className="text-sm font-semibold text-[#781216] underline underline-offset-4"
        >
          Quản lý đặt lịch thuê
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Tháng trước"
              className={navigation}
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <Icon name="chevron" className="rotate-180" />
            </button>
            <strong className="text-sm">
              Tháng {Number(month.slice(5, 7))} / {month.slice(0, 4)}
            </strong>
            <button
              type="button"
              aria-label="Tháng sau"
              className={navigation}
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              <Icon name="chevron" />
            </button>
          </div>
          {state === "loading" ? (
            <p className="py-12 text-center text-sm">Đang tải lịch thuê…</p>
          ) : state === "error" ? (
            <div role="alert" className="py-8 text-center text-sm text-red-800">
              Chưa tải được lịch thuê.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setRetry((v) => v + 1)}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                <span key={day} className="py-2 text-xs text-stone-500">
                  {day}
                </span>
              ))}
              {calendarDays(month).map((date) => {
                const booked = rows.some(
                  (row) => row.start <= date && row.end >= date,
                );
                const outside = date.slice(0, 7) !== month.slice(0, 7);
                return (
                  <button
                    key={date}
                    type="button"
                    aria-label={`${formatRentalDate(date)}: ${booked ? "Đã đặt, đã nhận cọc" : "Chưa có lịch đã đặt"}`}
                    aria-pressed={selected === date}
                    aria-current={date === today ? "date" : undefined}
                    onClick={() => setSelected(date)}
                    className={`min-h-11 rounded-md border text-sm transition ${selected === date ? "border-[#781216] ring-1 ring-[#781216]" : "border-transparent"} ${booked ? "bg-[#781216] font-semibold text-white hover:bg-[#5e1012]" : "bg-green-50 text-green-900 hover:bg-green-100"} ${outside ? "opacity-40" : ""}`}
                  >
                    <span>{Number(date.slice(8))}</span>
                    {date === today && (
                      <span className="mx-auto block h-1 w-1 rounded-full bg-current" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-600">
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#781216]" />
              Đã nhận cọc / khóa lịch
            </span>
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-100" />
              Chưa có lịch đã đặt
            </span>
          </div>
        </div>
        {state === "ready" && matches.length > 0 && <div
          aria-live="polite"
          className="self-start rounded-lg bg-stone-50 p-5"
        >
          {matches.map((row) => (
              <div key={row.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    {row.start === row.end
                      ? formatRentalDate(row.start)
                      : `${formatRentalDate(row.start)} — ${formatRentalDate(row.end)}`}
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    Đã nhận cọc
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex flex-wrap gap-x-3">
                    <dt className="w-24 text-stone-500">Khách hàng</dt>
                    <dd className="min-w-0 break-words font-medium">
                      {row.name}
                    </dd>
                  </div>
                  <div className="flex items-center gap-x-3">
                    <dt className="w-24 shrink-0 text-stone-500">Điện thoại</dt>
                    <dd className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <a
                        href={`tel:${row.phone}`}
                        className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
                      >
                        {row.phone}
                      </a>
                      <Link
                        href={`/admin/dat-lich?requestId=${encodeURIComponent(row.id)}`}
                        className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap text-sm font-semibold text-slate-700 hover:text-slate-950 hover:underline"
                      >
                        Xem đơn thuê <Icon name="arrow" className="!h-4 !w-4" />
                      </Link>
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
        </div>}
      </div>
    </div>
  );
}
