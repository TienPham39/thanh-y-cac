"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icon";

export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const toneStyles: Record<ToastTone, { accent: string; icon: string; label: string }> = {
  success: { accent: "border-green-500 bg-green-50 text-green-700", icon: "✓", label: "Thành công" },
  error: { accent: "border-red-500 bg-red-50 text-red-700", icon: "!", label: "Lỗi" },
  warning: { accent: "border-amber-500 bg-amber-50 text-amber-800", icon: "!", label: "Cảnh báo" },
  info: { accent: "border-blue-500 bg-blue-50 text-blue-700", icon: "i", label: "Thông tin" },
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const duration = item.action ? 7000 : 5000;

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current(item.id), duration);
    return () => window.clearTimeout(timer);
  }, [duration, item.id, item.message]);

  const style = toneStyles[item.tone];
  return <div
    role={item.tone === "error" ? "alert" : "status"}
    aria-live={item.tone === "error" ? "assertive" : "polite"}
    className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-l-4 border-[#e6e1e2] bg-white p-4 text-[#312d30] shadow-[0_14px_38px_rgba(45,24,27,0.18)] sm:w-[390px]"
    style={{ borderLeftColor: item.tone === "success" ? "#22c55e" : item.tone === "error" ? "#ef4444" : item.tone === "warning" ? "#f59e0b" : "#3b82f6" }}
  >
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${style.accent}`} aria-hidden="true">{style.icon}</span>
    <div className="min-w-0 flex-1 pt-0.5">
      <p className="text-sm font-semibold">{style.label}</p>
      <p className="mt-1 text-sm leading-5 text-[#686268]">{item.message}</p>
      {item.action && <button type="button" className="mt-2 text-sm font-semibold text-[#80151c] underline decoration-[#80151c]/35 underline-offset-4 hover:decoration-[#80151c]" onClick={() => { item.action?.onClick(); onDismiss(item.id); }}>{item.action.label}</button>}
    </div>
    <button type="button" aria-label="Đóng thông báo" onClick={() => onDismiss(item.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#777077] transition hover:bg-[#f3f0f1] hover:text-[#2f292d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c]"><Icon name="close" className="!h-4 !w-4" /></button>
  </div>;
}

export default function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !items.length) return null;
  return createPortal(<div aria-label="Thông báo" className="pointer-events-none fixed inset-x-4 top-4 z-[150] font-[Inter] flex flex-col items-end gap-3 sm:left-auto sm:right-5 sm:top-5">
    {items.map(item => <Toast key={`${item.id}-${item.message}`} item={item} onDismiss={onDismiss} />)}
  </div>, document.body);
}
