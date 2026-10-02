"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckoutSteps, checkoutButton, money } from "./checkout-shared";
import { apiFetch } from "@/lib/api-fetch";
import { useSiteState } from "./site-layout";
import { Icon } from "./icon";
import type { PaymentSettings } from "./checkout-page";
type Result = {
  id: string;
  state: string;
  paymentMethod: string;
  amount: number;
  total: number;
  remaining: number;
  expiresAt: string;
  checkoutUrl: string | null;
  qrCode: string | null;
  reviewReason: string | null;
  bank: PaymentSettings["bank"];
  transferContent: string;
  items: {
    id: string;
    productSlug: string;
    productCode: string;
    productName: string;
    start: string;
    end: string;
    status: string;
    online: boolean;
  }[];
};
function PaymentQr({ value }: { value: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    import("qrcode")
      .then((q) => {
        if (canvas.current && active)
          return q.toCanvas(canvas.current, value, {
            width: 240,
            margin: 2,
            errorCorrectionLevel: "M",
          });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [value]);
  return error ? (
    <p className="text-sm text-stone-500">
      Không hiển thị được QR. Bạn có thể mở trang payOS bên dưới.
    </p>
  ) : (
    <canvas
      ref={canvas}
      role="img"
      aria-label="Mã QR thanh toán cọc payOS"
      className="mx-auto my-5 max-w-full rounded-lg border border-stone-200"
    />
  );
}
export default function PaymentResultPage() {
  const { setCart } = useSiteState();
  const [credentials, setCredentials] = useState<{
      id: string;
      token: string;
    } | null>(null),
    [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [copied, setCopied] = useState("");
  const cleared = useRef(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || "";
    let token = "";
    try {
      token = sessionStorage.getItem(`tyc-payment-${id}`) || "";
    } catch {}
    if (!id || !token) {
      setError(
        "Thiếu mã truy cập đơn. Hãy mở kết quả trên trình duyệt đã tạo đơn hoặc liên hệ cửa hàng cùng mã đơn.",
      );
      return;
    }
    setCredentials({ id, token });
  }, []);
  useEffect(() => {
    if (!credentials) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const r = await apiFetch("/api/checkout/lookup", {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...credentials, retry: retry > 0 }),
        });
        const b = await r.json();
        if (!r.ok) throw Error(b.error?.message || "Không tải được đơn.");
        if (abort.signal.aborted) return;
        const data: Result = b.data;
        setResult(data);
        setError("");
        if (!cleared.current) {
          setCart((current) =>
            current.filter(
              (i) =>
                !data.items.some(
                  (row) =>
                    row.productCode &&
                    row.start === i.start &&
                    row.end === i.end &&
                    row.productSlug === i.productSlug,
                ),
            ),
          );
          cleared.current = true;
        }
        if (["pending", "manual"].includes(data.state))
          timer = setTimeout(load, 5000);
      } catch (e) {
        if (!abort.signal.aborted) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [credentials, retry, setCart]);
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
    } catch {
      setCopied("");
    }
  }
  const paid = result?.state === "paid" || result?.state === "confirmed",
    manual = result?.state === "manual",
    zero = manual && result?.amount === 0;
  return (
    <main className="relative z-[2] mx-auto max-w-[1000px] px-4 py-10 sm:px-6">
      <CheckoutSteps step={paid || zero ? 4 : 3} />
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg bg-red-50 p-4 text-red-800"
        >
          {error}
          {credentials && (
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="ml-3 underline"
            >
              Thử lại
            </button>
          )}
        </div>
      )}
      {!result && !error && (
        <p role="status">Đang kiểm tra kết quả thanh toán…</p>
      )}
      {result && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 sm:p-10">
          <div className="text-center">
            {(paid || zero) && (
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-12 w-12"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>
            )}
            <h1 className="text-2xl font-semibold text-[#781216]">
              {paid
                ? result.amount === 0
                  ? "Đã xác nhận lịch thuê"
                  : "Đã xác nhận cọc & giữ lịch"
                : zero
                  ? "Đã gửi yêu cầu đặt thuê"
                  : result.state === "review"
                    ? "Đơn cần đối soát"
                    : result.state === "expired"
                      ? "Liên kết thanh toán đã hết hạn"
                      : result.state === "cancelled"
                        ? "Đơn thuê đã hủy"
                        : "Thanh toán cọc giữ lịch"}
            </h1>
            <p className="mt-3 text-sm text-stone-500">
              Mã đơn: <strong className="break-all">{result.id}</strong>
            </p>
            {result.state === "pending" && (
              <p className="mt-3 text-sm text-amber-800">
                Giữ tạm 15 phút, hết hạn lúc{" "}
                {new Date(result.expiresAt).toLocaleTimeString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
                . Kết quả được xác nhận tự động sau khi ngân hàng báo tiền.
              </p>
            )}
            {result.state === "pending" && !result.checkoutUrl && (
              <div className="mt-4 text-sm text-stone-500">
                <p>Liên kết thanh toán chưa sẵn sàng. Bạn có thể lấy lại liên kết của đơn này.</p>
                <button type="button" onClick={() => setRetry(n => n + 1)} className={`${checkoutButton} mt-3`}>Lấy lại liên kết thanh toán</button>
              </div>
            )}
            {manual && (
              <p className="mt-3 text-sm text-stone-500">
                {zero
                  ? "Cửa hàng sẽ liên hệ để xác nhận lịch thuê."
                  : "Chuyển khoản đúng nội dung bên dưới. Cửa hàng kiểm tra tiền và xác nhận giữ lịch; màn hình này tự cập nhật kết quả."}
              </p>
            )}
            {paid && (
              <p className="mt-3 text-sm text-green-700">
                Lịch thuê đã xác nhận được hiển thị bên dưới. Các trang phục còn
                chờ sẽ được cửa hàng xác nhận riêng.
              </p>
            )}
            {result.reviewReason && (
              <p
                role="status"
                className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900"
              >
                {result.reviewReason} Liên hệ 0779 312 303 và cung cấp mã đơn.
              </p>
            )}
          </div>
          {(result.state === "pending" || manual) && result.amount > 0 && (
            <div className="mx-auto mt-8 max-w-lg rounded-xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-center text-sm text-stone-500">Số tiền cọc</p>
              <p className="mt-2 text-center text-3xl font-semibold text-[#781216]">
                {money(result.amount)}
              </p>
              {result.state === "pending" && result.qrCode && (
                <PaymentQr value={result.qrCode} />
              )}{" "}
              {manual && (
                <dl className="mt-5 space-y-3 text-sm">
                  {[
                    ["Ngân hàng", result.bank.name],
                    ["Chủ tài khoản", result.bank.holder],
                    ["Số tài khoản", result.bank.account],
                    ["Nội dung", result.transferContent],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-wrap justify-between gap-2"
                    >
                      <dt className="text-stone-500">{label}</dt>
                      <dd className="flex items-center gap-2 font-medium">
                        {value}
                        <button
                          type="button"
                          onClick={() => void copy(value)}
                          aria-label={`Sao chép ${label}`}
                          className="text-xs text-[#781216] underline"
                        >
                          {copied === value ? "Đã chép" : "Sao chép"}
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {result.checkoutUrl && (
                <a
                  href={result.checkoutUrl}
                  className={`${checkoutButton} mt-5 w-full`}
                >
                  Mở trang thanh toán payOS <Icon name="arrow" />
                </a>
              )}
              {manual && (
                <a
                  href="https://zalo.me/0779312303"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${checkoutButton} mt-5 w-full`}
                >
                  Gửi biên lai cho cửa hàng qua Zalo
                </a>
              )}
            </div>
          )}
          <ul className="mt-8 divide-y divide-stone-100 border-t border-stone-200">
            {result.items.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap justify-between gap-3 py-4 text-sm"
              >
                <div>
                  <strong>
                    {i.productCode} · {i.productName}
                  </strong>
                  <p className="mt-1 text-stone-500">
                    {i.start} → {i.end}
                  </p>
                </div>
                <span className="text-[#9a6d16]">
                  {i.status === "confirmed"
                    ? "Đã giữ lịch"
                    : i.status === "completed"
                      ? "Đã hoàn tất"
                      : i.status === "cancelled"
                        ? "Đã hủy"
                        : "Chờ xác nhận"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap justify-between gap-3 border-t pt-5 text-sm">
            <span>
              Tổng tiền thuê: <strong>{money(result.total)}</strong>
            </span>
            <span>
              Còn thanh toán sau cọc: <strong>{money(result.remaining)}</strong>
            </span>
          </div>
          <Link
            href="/trang-phuc/"
            className="mt-7 inline-flex text-sm font-semibold text-[#781216] hover:underline"
          >
            Tiếp tục xem trang phục →
          </Link>
        </section>
      )}
    </main>
  );
}
