"use client";

import { useEffect, useId, useRef, useState } from "react";

export type AdminSelectOption = { value: string; label: string };

export default function AdminSelect({
  ariaLabel,
  value,
  options,
  onChange,
  className = "",
  placement = "bottom",
}: {
  ariaLabel: string;
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  placement?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(current => !current)}
        onKeyDown={event => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#ded8da] bg-white px-4 py-2.5 text-left text-sm text-[#39333a] outline-none transition hover:border-[#b98b8e] focus-visible:border-[#80151c] focus-visible:ring-2 focus-visible:ring-[#80151c]/15"
      >
        <span className="truncate">{selected?.label}</span>
        <svg className={`h-4 w-4 shrink-0 text-[#80151c] transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div id={listId} role="listbox" aria-label={ariaLabel} className={`absolute left-0 right-0 z-50 max-h-64 overflow-auto rounded-xl border border-[#eadfe0] bg-white p-1.5 shadow-[0_14px_35px_rgba(67,29,33,0.16)] ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}>
          {options.map(option => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${active ? "bg-[#80151c] border !border-[#b8872e] font-medium text-white" : "text-[#4d464b] hover:bg-[#f9eeee] hover:text-[#80151c]"}`}
              >
                <span>{option.label}</span>
                {active && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
