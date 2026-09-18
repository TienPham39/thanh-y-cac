"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function AnimatedProductCard({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const card = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!card || preference.matches || !("IntersectionObserver" in window)) return;
    let animation: Animation | undefined;
    const reveal = () => {
      card.style.opacity = "";
      animation?.cancel();
      observer.disconnect();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      card.style.opacity = "";
      // Stagger only siblings in the same visual row, including responsive grids.
      const siblings = [...(card.parentElement?.children ?? [])];
      const rowIndex = siblings.filter(el => el instanceof HTMLElement && el.offsetTop === card.offsetTop).indexOf(card);
      animation = card.animate([
        { opacity: 0, transform: "translateY(20px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 600, delay: 80 + Math.min(Math.max(rowIndex, 0) * 100, 300), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" });
      observer.unobserve(card);
    }, { threshold: 0.05 });
    card.style.opacity = "0";
    observer.observe(card);
    card.addEventListener("focusin", reveal);
    preference.addEventListener("change", reveal);
    return () => {
      reveal();
      card.removeEventListener("focusin", reveal);
      preference.removeEventListener("change", reveal);
    };
  }, []);
  return <article ref={ref} className={className}>{children}</article>;
}
