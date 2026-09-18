import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-12">
        <Link href="/" className="brand text-xl font-semibold tracking-wide">Thanh Y Các<span className="sr-only"> — Trang chủ</span></Link>
        <span className="text-xs uppercase tracking-[0.2em] text-[#52635b]">Một khởi đầu mới</span>
      </header>
      <main id="main" className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-14 px-6 py-16 sm:px-12 md:grid-cols-[1.2fr_1fr]">
        <section>
          <p className="mb-7 text-xs font-semibold uppercase tracking-[0.3em] text-[#647b6d]">Chào mừng đến với</p>
          <h1 className="brand text-6xl leading-[1.08] tracking-tight sm:text-8xl">Thanh<br />Y Các<span className="text-[#a06b46]">.</span></h1>
          <div className="my-9 h-px w-16 bg-[#a06b46]" />
          <p className="max-w-sm text-lg leading-8 text-[#52635b]">Một không gian mới đang dần thành hình. Hẹn gặp bạn trong những trải nghiệm sắp tới.</p>
          <p className="mt-10 inline-flex items-center gap-3 text-sm text-[#52635b]"><span className="h-2 w-2 rounded-full bg-[#8a6942]" />Đang chuẩn bị ra mắt</p>
        </section>
        <div className="relative mx-auto flex aspect-[4/5] w-full max-w-sm items-center justify-center overflow-hidden rounded-t-full border border-[#c4ccbd] bg-[#e6eadd]" aria-hidden="true">
          <div className="absolute inset-7 rounded-t-full border border-[#bcc7b4]" />
          <div className="absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-[#c9d2bd]" />
          <div className="absolute -right-16 bottom-6 h-64 w-64 rounded-full bg-[#adbfa8]" />
          <span className="brand relative mb-8 text-center text-6xl leading-tight text-[#355344]">Thanh<br />Y Các</span>
          <span className="absolute bottom-9 text-xs uppercase tracking-[0.35em] text-[#355344]">An nhiên · Tinh tế</span>
        </div>
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-3 border-t border-[#d9ddcf] px-6 py-6 text-xs text-[#52635b] sm:px-12"><span>Thanh Y Các</span><span>Chăm chút từ những điều nhỏ nhất.</span></footer>
    </div>
  );
}
