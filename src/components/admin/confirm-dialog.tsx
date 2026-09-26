"use client";

import { useEffect, useId, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  tone = "danger",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return <dialog
    ref={dialog}
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}
    onClick={event => { if (!busy && event.target === event.currentTarget) onCancel(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-xl border border-[#eadfda] bg-white p-0 text-[#292931] shadow-[0_20px_55px_rgba(56,20,22,0.22)] backdrop:bg-black/50"
  >
    <div className="p-6 sm:p-7">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full text-xl font-semibold ${tone === "danger" ? "bg-red-50 text-[#b52222]" : "bg-[#f9eceb] text-[#80151c]"}`} aria-hidden="true">!</div>
      <h2 id={titleId} className="text-xl font-semibold text-[#241b1c]">{title}</h2>
      <p id={descriptionId} className="mt-2 text-sm leading-6 text-[#66616a]">{description}</p>
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm leading-5 text-red-800">{error}</p>}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button autoFocus type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-lg border border-[#d9d5d7] bg-white px-5 text-sm font-semibold text-[#4f4b52] transition hover:border-[#9b9296] hover:bg-[#faf9f9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c] disabled:cursor-wait disabled:opacity-50">{cancelLabel}</button>
        <button type="button" disabled={busy} onClick={onConfirm} className={`min-h-11 rounded-lg px-5 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 ${tone === "danger" ? "bg-[#b52222] hover:bg-[#941b1b] focus-visible:outline-[#b52222]" : "bg-[#80151c] hover:bg-[#650c13] focus-visible:outline-[#80151c]"}`}>{busy ? "Đang xử lý…" : confirmLabel}</button>
      </div>
    </div>
  </dialog>;
}
