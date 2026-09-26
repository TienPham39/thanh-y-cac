"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.get("identifier"),
          password: form.get("password"),
        }),
      });
      const result = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        setMessage(result.error?.message || "Không thể đăng nhập. Vui lòng thử lại.");
        return;
      }

      const requested = new URLSearchParams(window.location.search).get("next");
      window.location.assign(requested?.startsWith("/admin") ? requested : "/admin");
    } catch {
      setMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#fff8f6] text-[#624a47]">
      <header className="flex h-16 shrink-0 items-center border-b border-[#eddbd5] bg-white px-6 md:px-[5.5%]">
        <Link href="/" aria-label="Thanh Y Các — Trang chủ">
          <Image
            src="/images/logo2.png"
            alt="Thanh Y Các"
            width={174}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </header>
      <main className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col overflow-y-auto px-6 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(max-height:800px)]:py-4">
          <div className="mx-auto my-auto w-full max-w-[420px] shrink-0">
            <div className="mb-10 text-center [@media(max-height:800px)]:mb-6 [@media(max-height:650px)]:mb-4">
              <span className="text-3xl text-[#80151c] [@media(max-height:650px)]:hidden" aria-hidden="true">
                ❀
              </span>
              <h1 className="mb-3 mt-3 text-[34px] font-bold text-[#650912]">
                Đăng nhập
              </h1>
              <p className="text-sm">
                Bước vào không gian phục dựng y phục vương triều xưa
              </p>
              <div
                className="mx-auto mt-6 flex w-28 items-center gap-2 text-[#bb8531] [@media(max-height:800px)]:mt-3 [@media(max-height:650px)]:hidden"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-[#e8c98f]" />❀
                <span className="h-px flex-1 bg-[#e8c98f]" />
              </div>
            </div>
            <form onSubmit={submitLogin} className="space-y-5 [@media(max-height:800px)]:space-y-4">
              <label className="block text-sm">
                Số điện thoại hoặc Email
                <input
                  required
                  name="identifier"
                  autoComplete="username"
                  defaultValue="admin@thanhycac.com"
                  placeholder="Nhập SĐT hoặc Email..."
                  className="mt-3 h-11 w-full appearance-none rounded border-2 border-[#ead7d0] bg-transparent px-4 !outline-[0px] !outline-offset-0 focus:border-[#80151c] focus:!shadow-none"
                />
              </label>
              <label className="block text-sm">
                Mật khẩu
                <span className="relative mt-2 block">
                  <input
                    required
                    minLength={6}
                    name="password"
                    autoComplete="current-password"
                    type={visible ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 w-full appearance-none rounded border-2 border-[#ead7d0] bg-transparent px-4 pr-14 !outline-[0px] !outline-offset-0 focus:border-[#80151c] focus:!shadow-none"
                  />
                  <button
                    type="button"
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                    className="absolute inset-y-0 right-0 px-4"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </span>
              </label>
              <div className="flex justify-between gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-[#80151c]"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <button
                  type="button"
                  className="text-[#80151c]"
                  onClick={() =>
                    setMessage(
                      "Liên hệ 0779 312 303 để được hỗ trợ khôi phục mật khẩu.",
                    )
                  }
                >
                  Quên mật khẩu?
                </button>
              </div>
              <button disabled={submitting} className="!mt-6 h-12 w-full rounded border border-[#c69b50] bg-[#80151c] font-medium text-white hover:bg-[#650912] disabled:cursor-wait disabled:opacity-70 [@media(max-height:650px)]:!mt-4">
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
              {message && (
                <p
                  role="alert"
                  className="rounded border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900"
                >
                  {message}
                </p>
              )}
            </form>
            <p className="mt-5 text-center text-sm text-[#977c75]">
              Trở về{" "}
              <Link href="/" className="ml-1 text-[#80151c]">
                Trang Chủ Thanh Y Các
              </Link>
            </p>
          </div>
        </div>
        <aside className="relative hidden min-h-0 overflow-hidden bg-[#211714] lg:block">
          <figure className="absolute inset-0">
            <Image
              src="/images/login-portrait-v2.png"
              alt="Người mặc cổ phục đỏ thêu vàng trong sân đình"
              fill
              priority
              sizes="50vw"
              className="object-cover object-center"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#170b0b]/95 via-[#170b0b]/60 to-transparent px-10 pb-10 pt-24">
              <p className="font-['Noto_Serif'] text-xl font-semibold leading-relaxed text-[#f4d49b]">
                “Nét Phong Hoa Cổ Kính”
              </p>
              <p className="mt-2 max-w-[60ch] text-sm leading-6 text-[#fff8f6]">
                Nơi tái hiện hoàn mỹ vẻ đẹp tinh hoa văn hóa và trang phục Việt
                cổ qua từng khung hình nghệ thuật.
              </p>
            </figcaption>
          </figure>
        </aside>
      </main>
    </div>
  );
}
