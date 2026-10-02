"use client";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "./icon";
import {
  CheckoutSteps,
  checkoutButton,
  checkoutInput,
  money,
  useCartProducts,
} from "./checkout-shared";
import { localToday } from "./admin/dashboard-date-filter";
export default function CartPage() {
  const { cart, setCart, rows, loading, error, valid, total, deposit } =
    useCartProducts();
  return (
    <main className="relative z-[2] mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-[#781216]">Giỏ hàng</h1>
      <CheckoutSteps step={1} />
      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {loading && <p role="status">Đang tải trang phục…</p>}
      {!cart.length ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <Icon
            name="cart"
            className="mx-auto mb-4 !h-12 !w-12 text-[#b8872e]"
          />
          <h2 className="text-lg font-semibold">Giỏ hàng đang trống</h2>
          <p className="mb-6 mt-2 text-sm text-stone-500">
            Chọn bộ trang phục yêu thích và lịch thuê của bạn.
          </p>
          <Link href="/trang-phuc/" className={checkoutButton}>
            Khám phá trang phục
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4" aria-label="Trang phục đã chọn">
            {rows.map((row) => (
              <article
                key={row.productSlug}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  {row.product && (
                    <Image
                      src={row.product.image}
                      unoptimized
                      alt={row.product.name}
                      width={96}
                      height={120}
                      className="h-28 w-20 shrink-0 rounded-lg bg-stone-50 object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#9a6d16]">
                      {row.product?.code}
                    </p>
                    <h2 className="mt-1 font-semibold text-[#781216]">
                      {row.product?.name || row.productSlug}
                    </h2>
                    {row.product && (
                      <p className="mt-2 text-sm">
                        {money(row.product.price)} / 24 giờ
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Bỏ ${row.product?.name || row.productSlug} khỏi giỏ`}
                    onClick={() =>
                      setCart(
                        cart.filter((i) => i.productSlug !== row.productSlug),
                      )
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-[#781216]"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Ngày nhận *
                    <input
                      type="date"
                      min={localToday()}
                      value={row.start}
                      onChange={(e) =>
                        setCart(
                          cart.map((i) =>
                            i.productSlug === row.productSlug
                              ? {
                                  ...i,
                                  start: e.target.value,
                                  end:
                                    i.end < e.target.value
                                      ? e.target.value
                                      : i.end,
                                }
                              : i,
                          ),
                        )
                      }
                      className={checkoutInput}
                    />
                  </label>
                  <label className="text-sm">
                    Ngày trả *
                    <input
                      type="date"
                      min={row.start || localToday()}
                      value={row.end}
                      onChange={(e) =>
                        setCart(
                          cart.map((i) =>
                            i.productSlug === row.productSlug
                              ? { ...i, end: e.target.value }
                              : i,
                          ),
                        )
                      }
                      className={checkoutInput}
                    />
                  </label>
                </div>
                {row.quote ? (
                  <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-stone-100 pt-3 text-sm">
                    <span>
                      Tiền thuê <strong>{money(row.quote.total)}</strong>
                    </span>
                    <span>
                      Cọc giữ lịch{" "}
                      <strong className="text-[#781216]">
                        {money(row.quote.deposit)}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-stone-500">
                    Chọn ngày nhận và ngày trả hợp lệ, tối đa 366 ngày.
                  </p>
                )}
              </article>
            ))}
          </section>
          <aside className="rounded-xl border border-stone-200 bg-white p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-[#781216]">
              Tổng đơn thuê
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Trang phục</dt>
                <dd>{cart.length} bộ</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tiền thuê tạm tính</dt>
                <dd>{money(total)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3">
                <dt>Cọc giữ lịch</dt>
                <dd className="font-semibold text-[#781216]">
                  {money(deposit)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Còn lại sau cọc</dt>
                <dd>{money(total - deposit)}</dd>
              </div>
            </dl>
            <p className="my-5 text-xs leading-5 text-stone-500">
              Cọc được trừ vào tiền thuê. Giá và lịch sẽ được kiểm tra lại trước
              khi tạo đơn. Trang phục cọc 0đ được cửa hàng xác nhận riêng.
            </p>
            {valid ? (
              <Link href="/thanh-toan/" className={`${checkoutButton} w-full`}>
                Tiếp tục <Icon name="arrow" />
              </Link>
            ) : (
              <button disabled className={`${checkoutButton} w-full`}>
                Chọn đủ ngày thuê để tiếp tục
              </button>
            )}
            <Link
              href="/trang-phuc/"
              className="mt-4 block text-center text-sm text-[#781216] hover:underline"
            >
              Chọn thêm trang phục
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
