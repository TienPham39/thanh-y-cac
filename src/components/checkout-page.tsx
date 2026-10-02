"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckoutSteps,
  checkoutButton,
  checkoutInput,
  money,
  useCartProducts,
} from "./checkout-shared";
import { apiFetch } from "@/lib/api-fetch";
import { Icon } from "./icon";
export type PaymentSettings = {
  enabled: boolean;
  bank: { name: string; account: string; holder: string };
};
export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    rows,
    valid,
    total,
    deposit,
    loading,
    error: cartError,
  } = useCartProducts();
  const [settings, setSettings] = useState<PaymentSettings | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [method, setMethod] = useState("bank_transfer");
  const submission = useRef<{ id: string; token: string } | null>(null);
  const pending = useRef(false);
  const [pendingId, setPendingId] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    apiFetch("/api/checkout", { signal: abort.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("Không tải được phương thức thanh toán.");
        const b = await r.json();
        setSettings(b);
        if (b.enabled) setMethod("payos");
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !settings || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const contact = Object.fromEntries(new FormData(event.currentTarget));
      if (!submission.current) {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        submission.current = {
          id: crypto.randomUUID(),
          token: Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
            "",
          ),
        };
      }
      const credentials = submission.current;
      sessionStorage.setItem(
        `tyc-payment-${credentials.id}`,
        credentials.token,
      );
      setPendingId(credentials.id);
      const r = await apiFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          ...credentials,
          method: deposit ? method : "bank_transfer",
          items: cart,
        }),
      });
      const b = await r.json();
      if (!r.ok)
        throw Error(b.error?.message || "Không tạo được đơn thanh toán.");
      router.push(`/ket-qua-thanh-toan/?id=${credentials.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  return (
    <main className="relative z-[2] mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-[#781216]">
        Thông tin thuê & thanh toán
      </h1>
      <CheckoutSteps step={2} />
      {loading && <p role="status">Đang kiểm tra giỏ hàng…</p>}
      {(error || cartError) && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-800">
          {error || cartError}
          {pendingId && (
            <Link
              href={`/ket-qua-thanh-toan/?id=${pendingId}`}
              className="ml-2 underline"
            >
              Kiểm tra đơn đang tạo
            </Link>
          )}
        </p>
      )}
      {!cart.length ? (
        <p className="rounded-lg bg-white p-8">
          Giỏ hàng đang trống.{" "}
          <Link href="/trang-phuc/" className="text-[#781216] underline">
            Chọn trang phục
          </Link>
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          <fieldset
            disabled={busy}
            className="space-y-6 rounded-xl border border-stone-200 bg-white p-5 sm:p-7"
          >
            <div>
              <h2 className="text-lg font-semibold text-[#781216]">
                Thông tin khách hàng
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Nhận và trả đồ tại cửa hàng Thanh Y Các, 583/66 đường 30 tháng
                4, Cần Thơ.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Họ và tên *
                <input
                  required
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  className={checkoutInput}
                />
              </label>
              <label className="text-sm">
                Số điện thoại / Zalo *
                <input
                  required
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={20}
                  pattern="(0[0-9]{9}|\+84[0-9]{9})"
                  className={checkoutInput}
                />
              </label>
              <label className="text-sm">
                Chiều cao (cm)
                <input
                  type="number"
                  name="height"
                  min={100}
                  max={230}
                  className={checkoutInput}
                />
              </label>
              <label className="text-sm">
                Cân nặng (kg)
                <input
                  type="number"
                  name="weight"
                  min={25}
                  max={200}
                  className={checkoutInput}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Ghi chú
                <textarea
                  name="note"
                  maxLength={2000}
                  rows={3}
                  className={checkoutInput}
                />
              </label>
            </div>
            <div className="border-t pt-5">
              <h2 className="text-lg font-semibold text-[#781216]">
                Phương thức đặt cọc
              </h2>
              {deposit > 0 ? (
                <div className="mt-4 space-y-3">
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-4 ${method === "payos" ? "border-[#b8872e] bg-[#fff8f0]" : "border-stone-200"} ${!settings?.enabled ? "opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment-choice"
                      value="payos"
                      checked={method === "payos"}
                      disabled={!settings?.enabled}
                      onChange={() => setMethod("payos")}
                      className="mt-1 accent-[#781216]"
                    />
                    <span className="text-sm">
                      <strong>Thanh toán cọc qua payOS</strong>
                      <span className="mt-1 block text-xs text-stone-500">
                        {settings?.enabled
                          ? "Quét QR / chuyển khoản và tự động xác nhận lịch."
                          : "Sắp mở. Hiện cửa hàng nhận cọc qua chuyển khoản."}
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-4 ${method === "bank_transfer" ? "border-[#b8872e] bg-[#fff8f0]" : "border-stone-200"}`}
                  >
                    <input
                      type="radio"
                      name="payment-choice"
                      value="bank_transfer"
                      checked={method === "bank_transfer"}
                      onChange={() => setMethod("bank_transfer")}
                      className="mt-1 accent-[#781216]"
                    />
                    <span className="text-sm">
                      <strong>Chuyển khoản ngân hàng</strong>
                      <span className="mt-1 block text-xs text-stone-500">
                        {settings?.bank.name} · {settings?.bank.account} ·{" "}
                        {settings?.bank.holder}
                        <br />
                        Cửa hàng kiểm tra tiền và xác nhận giữ lịch.
                      </span>
                    </span>
                  </label>
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-500">
                  Các trang phục này chưa yêu cầu cọc online. Cửa hàng sẽ liên
                  hệ xác nhận lịch sau khi bạn gửi đơn.
                </p>
              )}
            </div>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                required
                className="mt-1 accent-[#781216]"
              />
              <span>
                Tôi đã kiểm tra ngày nhận, ngày trả và hiểu rằng cọc được trừ
                vào tiền thuê. Lịch chỉ được giữ chính thức sau khi cọc được xác
                nhận; trả sớm không tự giảm tiền thuê đã chốt.
              </span>
            </label>
          </fieldset>
          <aside className="rounded-xl border border-stone-200 bg-white p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-[#781216]">
              Đơn thuê của bạn
            </h2>
            <ul className="mt-4 divide-y divide-stone-100">
              {rows.map((row) => (
                <li key={row.productSlug} className="py-3 text-sm">
                  <strong>{row.product?.name || row.productSlug}</strong>
                  <p className="mt-1 text-xs text-stone-500">
                    {row.start} → {row.end}
                  </p>
                  <p className="mt-1">
                    {money(row.quote?.total || 0)} · Cọc{" "}
                    {money(row.quote?.deposit || 0)}
                  </p>
                  {row.quote?.deposit === 0 && (
                    <p className="mt-1 text-xs text-amber-800">
                      Cửa hàng xác nhận riêng
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-3 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Tổng tiền thuê</dt>
                <dd>{money(total)}</dd>
              </div>
              <div className="flex justify-between font-semibold text-[#781216]">
                <dt>Cọc cần thanh toán</dt>
                <dd>{money(deposit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Còn lại sau cọc</dt>
                <dd>{money(total - deposit)}</dd>
              </div>
            </dl>
            <button
              disabled={busy || !valid || !settings}
              className={`${checkoutButton} mt-6 w-full`}
            >
              <Icon name="shield" />
              {busy
                ? "Đang tạo đơn…"
                : deposit
                  ? "Tạo đơn & thanh toán cọc"
                  : "Gửi yêu cầu đặt thuê"}
            </button>
            <Link
              href="/gio-hang/"
              className="mt-4 block text-center text-sm text-[#781216] hover:underline"
            >
              Quay lại giỏ hàng
            </Link>
          </aside>
        </form>
      )}
    </main>
  );
}
