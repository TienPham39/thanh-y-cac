"use client";

import { useLayoutEffect } from "react";

// No wrapper elements: preserve grids, sticky positioning and stacking layers.
export function PageReveal() {
  useLayoutEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !("IntersectionObserver" in window)) return;
    const selector = "[data-page-reveal], [data-catalog-reveal], .header-inner > :not(.header-ornament), .footer-grid > *";
    const seen = new WeakSet<Element>();
    const pending = new Set<HTMLElement>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      visible.forEach((entry, index) => {
        const element = entry.target as HTMLElement;
        element.style.opacity = "";
        pending.delete(element);
        observer.unobserve(element);
        const animation = element.animate([
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 550, delay: Math.min(index * 70, 210), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.05 });
    const discover = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach(element => {
        if (seen.has(element)) return;
        seen.add(element);
        pending.add(element);
        element.style.opacity = "0";
        observer.observe(element);
      });
    };
    const mutations = new MutationObserver(discover);
    const stop = () => {
      observer.disconnect();
      mutations.disconnect();
      pending.forEach(element => { element.style.opacity = ""; });
      pending.clear();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>(selector);
      if (!element) return;
      element.style.opacity = "";
      pending.delete(element);
      observer.unobserve(element);
      element.getAnimations().forEach(animation => animation.cancel());
    };
    discover();
    mutations.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", focus);
    preference.addEventListener("change", stop);
    return () => {
      stop();
      document.removeEventListener("focusin", focus);
      preference.removeEventListener("change", stop);
    };
  }, []);
  return null;
}
