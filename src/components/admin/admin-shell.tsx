"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "../icon";

export const buttonStyle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d9d9df] bg-white px-4 py-2 text-sm font-medium transition hover:border-[#80151c] hover:text-[#80151c] disabled:cursor-not-allowed disabled:opacity-40";
export const primaryStyle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#80151c] bg-[#80151c] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#650912]";
export const inputStyle = "mt-1.5 min-h-10 w-full rounded-md border border-[#dedee4] bg-white px-3 py-2 text-sm text-[#333541] outline-none placeholder:text-[#777b86] focus:border-[#80151c] focus:ring-1 focus:ring-[#80151c]";

export default function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } finally {
      window.location.assign("/login");
    }
  }
  const items: [IconName, string][] = [["hanger", "Trang phục"], ["tag", "Danh mục"], ["calendar", "Đặt lịch thuê"], ["users", "Khách hàng"], ["book", "Tin tức"], ["shield", "Cài đặt"]];
  return <div className="min-h-screen bg-[#f8f7f7] font-['Inter'] text-[#34343e] [&_h1]:font-['Inter'] [&_h2]:font-['Inter'] [&_h3]:font-['Inter']">
    <aside className={`${open ? "block" : "hidden"} fixed inset-y-0 left-0 z-30 w-56 border-r border-[#e8e6e6] bg-white lg:block`}>
      <Link href="/" className="block px-6 py-5"><Image src="/images/logo2.png" alt="Thanh Y Các" width={180} height={61} priority /></Link>
      <nav aria-label="Quản trị" className="mt-8 space-y-2 px-3"><Link href="/admin" className="flex items-center gap-4 rounded-md px-4 py-3 text-[#80151c]"><Icon name="menu" />Tổng quan</Link>{items.map(([icon, label], i) => i === 0 ? <Link key={label} href="/admin/trang-phuc" aria-current="page" className="flex items-center gap-4 rounded-md bg-[#80151c] px-4 py-3 font-semibold text-white"><Icon name={icon} />{label}</Link> : <span key={label} title="Chưa triển khai" className="flex cursor-default items-center gap-4 px-4 py-3 text-[#787880]"><Icon name={icon} />{label}</span>)}</nav>
      <div className="absolute inset-x-0 bottom-0 border-t border-[#e8e6e6] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7e8e7] text-sm font-semibold text-[#80151c]">AD</span>
          <div className="min-w-0 flex-1 text-sm"><strong>Admin</strong><p className="mt-0.5 truncate text-xs text-[#747782]" title="admin@thanhycac.com">admin@thanhycac.com</p></div>
          <button type="button" title="Đăng xuất" aria-label="Đăng xuất" disabled={signingOut} onClick={signOut} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#80151c] transition hover:bg-[#f7e8e7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c] disabled:cursor-wait disabled:opacity-50"><Icon name="logout" /></button>
        </div>
      </div>
    </aside>
    {open && <button aria-label="Đóng menu" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-black/30 lg:hidden" />}
    <div className="lg:ml-56"><header className="flex h-[76px] items-center gap-4 border-b border-[#e8e6e6] bg-white px-5 md:px-8"><button className="lg:hidden" aria-label="Mở menu quản trị" onClick={() => setOpen(true)}><Icon name="menu" /></button><h1 className="text-lg font-semibold text-[#292931] md:text-xl">{title}</h1></header>
      <main className="mx-auto max-w-[1600px] p-4 md:p-7">{children}</main>
    </div>
  </div>;
}
