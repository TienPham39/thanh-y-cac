"use client";

import { memo, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

// One engine and one viewport-sized canvas across client-side navigation.
let engineReady: Promise<void> | undefined;
const options: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  detectRetina: false,
  pauseOnBlur: true,
  pauseOnOutsideViewport: true,
  interactivity: {
    events: { onClick: { enable: false }, onHover: { enable: false } },
  },
  particles: {
    number: { value: 22, density: { enable: false } },
    shape: {
      type: "image",
      options: {
        image: { src: "/images/particles/cherry-petal.png", width: 64, height: 80 },
      },
    },
    opacity: { value: { min: 0.25, max: 0.5 } },
    size: { value: { min: 7, max: 13 } },
    move: {
      enable: true,
      direction: "bottom",
      speed: { min: 0.45, max: 0.95 },
      drift: { min: -0.2, max: 0.2 },
      straight: false,
      outModes: { default: "out" },
    },
    rotate: {
      value: { min: 0, max: 360 },
      direction: "random",
      animation: { enable: true, speed: { min: 2, max: 5 }, sync: false },
    },
    links: { enable: false },
    collisions: { enable: false },
  },
  responsive: [{ maxWidth: 768, options: {
    particles: { number: { value: 15 }, size: { value: { min: 6, max: 10 } } },
  } }],
};

function CherryBlossomParticles() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    const update = () => {
      if (preference.matches) {
        setEnabled(false);
        return;
      }
      engineReady ??= initParticlesEngine(async (engine) => { await loadSlim(engine); });
      void engineReady.then(() => {
        if (!disposed && !preference.matches) setEnabled(true);
      }).catch(() => {
        // Decorative failure must never interrupt browsing or prevent a retry.
        engineReady = undefined;
      });
    };
    update();
    preference.addEventListener("change", update);
    return () => {
      disposed = true;
      preference.removeEventListener("change", update);
    };
  }, []);

  if (!enabled) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden motion-reduce:hidden">
      <Particles id="cherry-blossom-particles" options={options} className="pointer-events-none h-full w-full [&_canvas]:!pointer-events-none" />
    </div>
  );
}

export default memo(CherryBlossomParticles);
