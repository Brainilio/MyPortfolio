"use client";
import { useEffect, useState } from "react";

// An image's natural aspect ratio (width / height), measured once per src and cached, so a picture can be laid out at
// its own shape and shown whole instead of cropped into a fixed box.
const pending = new Map(), known = new Map();

// Resolves to the ratio, or null if the image can't be loaded (or outside the browser).
export function getImageRatio(src) {
  if (!src || typeof Image === "undefined") return Promise.resolve(null);
  if (!pending.has(src)) {
    pending.set(src, new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : null;
        if (ratio) known.set(src, ratio);
        resolve(ratio);
      };
      image.onerror = () => resolve(null);
      image.src = src;
    }));
  }
  return pending.get(src);
}

// The ratio for a component: `fallback` until it's known (straight away if it was measured before).
export function useImageRatio(src, fallback = 16 / 10) {
  const [ratio, setRatio] = useState(() => known.get(src) ?? fallback);
  useEffect(() => {
    let live = true;
    setRatio(known.get(src) ?? fallback);
    getImageRatio(src).then(r => { if (live && r) setRatio(r); });
    return () => { live = false; };
  }, [src, fallback]);
  return ratio;
}

// A width for a picture of this ratio that keeps its area close to a `base`-wide one of `baseRatio` (so tall and very
// wide pictures don't dwarf or vanish beside the rest), within `min`–`max` times the base.
export function fitWidth(base, ratio, { baseRatio = 16 / 10, min = .6, max = 1.35 } = {}) {
  return base * Math.min(max, Math.max(min, Math.sqrt(ratio / baseRatio)));
}
