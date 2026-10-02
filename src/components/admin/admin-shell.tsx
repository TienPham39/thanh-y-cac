"use client";
import AdminNotifications from "./admin-notifications";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "../icon";

export const buttonStyle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d9d9df] bg-white px-4 py-2 text-sm font-medium transition hover:border-[#80151c] hover:text-[#80151c] disabled:cursor-not-allowed disabled:opacity-40";
export const primaryStyle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#b8872e] bg-[#80151c] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#650912]";
export const inputStyle = "mt-1.5 min-h-10 w-full rounded-md border border-[#dedee4] bg-white px-3 py-2 text-sm text-[#333541] outline-none placeholder:text-[#777b86] focus:border-[#80151c] focus:ring-1 focus:ring-[#80151c]";

export default function AdminShell({ children, title, actions }: { children: React.ReactNode; title: string; actions?: React.ReactNode }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [session, setSession] = useState<{ email: string; name: string; role: "admin" | "manager" } | null>(null);
  const [sessionError, setSessionError] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/auth/session', { cache: 'no-store', signal: abort.signal })
      .then(async response => {
        if (response.status === 401) {
          window.location.replace('/login?next=' + encodeURIComponent(window.location.pathname + window.location.search));
          return;
        }
        if (!response.ok) throw new Error('Session unavailable');
        const body = await response.json();
        setSession(body.data);
      })
      .catch(error => { if (error.name !== 'AbortError') setSessionError(true); });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } finally {
      window.location.assign("/login");
    }
  }
  const items: { icon: IconName; label: string; href?: string }[] = [
    { icon: "dashboard", label: "Tổng quan", href: "/admin" },
    { icon: "hanger", label: "Trang phục", href: "/admin/trang-phuc" },
    { icon: "tag", label: "Danh mục", href: "/admin/danh-muc" },
    { icon: "calendar", label: "Đặt lịch thuê", href: "/admin/dat-lich" },
  ];
  if (session?.role === "admin") items.push({icon: "users", label: "Người dùng", href: "/admin/nguoi-dung"});
  function isActive(href?: string) {
    if (!href) return false;
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }
  if (!session) return <main className="p-12 text-center"><p role="status">{sessionError ? 'Chưa kiểm tra được phiên đăng nhập. Vui lòng tải lại trang.' : 'Đang kiểm tra đăng nhập…'}</p></main>;
  return <div className="min-h-screen bg-[#f8f7f7] font-['Inter'] text-[#34343e] [&_h1]:font-['Inter'] [&_h2]:font-['Inter'] [&_h3]:font-['Inter']">
    <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 w-[min(84vw,320px)] flex-col overflow-y-auto border-r border-[#ece7e8] bg-white text-[#4e484d] shadow-[12px_0_36px_rgba(52,19,23,0.16)] lg:flex lg:w-64 lg:overflow-hidden lg:shadow-[8px_0_28px_rgba(70,8,14,0.08)]`}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#80151c]/[0.035]" />
      <Link href="/" className="relative flex h-24 shrink-0 items-center justify-center px-14 lg:h-[112px] lg:px-7"><Image src="/images/logo2.png" alt="Thanh Y Các" width={184} height={62} className="h-auto w-[168px] lg:w-[184px]" priority /></Link>
      <button type="button" aria-label="Đóng sidebar quản trị" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-[#756b70] transition hover:bg-[#f8eeee] hover:text-[#80151c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c] lg:hidden"><Icon name="close" /></button>
      <nav aria-label="Quản trị" className="relative mt-2 flex-1 space-y-1.5 px-3 pb-6 lg:mt-3 lg:space-y-2 lg:pl-4 lg:pr-0">
        {items.map(item => {
          const active = isActive(item.href);
          return <div key={item.label} className={`relative ${active ? "lg:ml-2" : "lg:pr-4"}`}>
            {active && <><span aria-hidden="true" className="absolute -top-6 right-0 hidden h-6 w-6 bg-[#80151c] lg:block"><span className="block h-full w-full rounded-br-[24px] bg-white" /></span><span aria-hidden="true" className="absolute -bottom-6 right-0 hidden h-6 w-6 bg-[#80151c] lg:block"><span className="block h-full w-full rounded-tr-[24px] bg-white" /></span></>}
            {item.href ? <Link href={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={`relative z-10 flex min-h-12 items-center gap-4 px-5 text-[15px] transition ${active ? "rounded-xl bg-[#80151c] font-semibold text-white shadow-[0_8px_22px_rgba(78,8,15,0.2)] lg:rounded-l-full lg:rounded-r-none lg:shadow-[-8px_10px_28px_rgba(48,4,9,0.12)]" : "rounded-xl text-[#5d575c] hover:bg-[#f8eeee] hover:text-[#80151c]"}`}><Icon name={item.icon} className="!h-[21px] !w-[21px]" /><span>{item.label}</span>{active && <Image src="/images/flower.png" alt="" width={14} height={14} aria-hidden="true" className="ml-auto h-3.5 w-3.5 shrink-0 object-contain brightness-110 contrast-125 saturate-150 drop-shadow-[0_0_2px_rgba(255,220,130,0.65)]" />}</Link> : <span title="Chưa triển khai" className="relative z-10 flex min-h-12 cursor-default items-center gap-4 rounded-xl px-5 text-[15px] text-[#aaa4a8]"><Icon name={item.icon} className="!h-[21px] !w-[21px]" />{item.label}</span>}
          </div>;
        })}
        <div className="!mt-6 border-t border-[#ece7e8] pt-5 lg:mr-4">
          <p className="mb-2 px-5 text-xs font-semibold uppercase tracking-wider text-[#9a6d16]">Bán hàng</p>
          <Link href="/trang-phuc/" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] text-[#5d575c] transition-colors hover:bg-[#f8eeee] hover:text-[#80151c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#80151c]">
            <Icon name="hanger" className="!h-[21px] !w-[21px] shrink-0" />
            <span className="whitespace-nowrap">Trang phục</span>
            <Icon name="arrow" className="ml-auto !h-4 !w-4 shrink-0 -rotate-45" />
          </Link>
        </div>
      </nav>
      <div className="sticky inset-x-0 bottom-0 mt-auto shrink-0 border-t border-[#ece7e8] bg-white/95 p-4 backdrop-blur-sm lg:absolute">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ead5d7] bg-[#faeeee] text-sm font-semibold text-[#80151c]">{session.role === "admin" ? "AD" : "QL"}</span>
          <div className="min-w-0 flex-1 text-sm"><strong className="font-semibold text-[#2f292d]">{session.name}</strong><p className="mt-0.5 truncate text-xs text-[#827b80]" title={session.email}>{session.email}</p></div>
          <button type="button" title="Đăng xuất" aria-label="Đăng xuất" disabled={signingOut} onClick={signOut} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#80151c] transition hover:bg-[#f8eeee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c] disabled:cursor-wait disabled:opacity-50"><Icon name="logout" /></button>
        </div>
      </div>
    </aside>
    {open && <button aria-label="Đóng menu" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-[#241416]/45 backdrop-blur-[1px] lg:hidden" />}
    <div className="lg:ml-64"><header className="flex h-[76px] items-center gap-4 border-b border-[#e8e6e6] bg-white px-5 md:px-8"><button className="lg:hidden" aria-label="Mở menu quản trị" onClick={() => setOpen(true)}><Icon name="menu" /></button><AdminNotifications /></header>
      <main className="mx-auto max-w-[1600px] p-4 md:p-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-lg font-semibold text-[#292931] md:text-xl">{title}</h1>{actions && <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{actions}</div>}</div>{children}</main>
    </div>
  </div>;
}
