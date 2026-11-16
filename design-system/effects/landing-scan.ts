import { createDitherScan, type DitherScanInstance } from "./dither-scan";

const mount = document.querySelector<HTMLDivElement>("#landing-scan")!;
const frame = mount.closest<HTMLElement>(".street-photo")!;
const image = frame.querySelector<HTMLImageElement>("img")!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let engine: DitherScanInstance | null = null;
let started = false;
let finished = false;

function dispose() {
  engine?.destroy();
  engine = null;
  mount.replaceChildren();
}

const observer = new IntersectionObserver(
  ([entry]) => {
    if (!entry.isIntersecting || document.hidden || started || finished) return;
    if (reduced.matches) {
      finish("static");
      return;
    }
    started = true;
    observer.disconnect();
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    mount.append(canvas);
    const tokens = getComputedStyle(document.documentElement);
    engine = createDitherScan(mount, canvas, {
      src: image.currentSrc || image.src,
      colors: [
        tokens.getPropertyValue("--ink").trim(),
        tokens.getPropertyValue("--paper").trim(),
      ],
      passes: 2,
      duration: 900,
      pause: 120,
      loop: false,
      onStart: () => {
        frame.dataset.scanState = "running";
      },
      onComplete: () => {
        queueMicrotask(() => finish("complete"));
      },
    });
    if (!engine) finish("fallback");
  },
  { threshold: 0.15 },
);

function finish(state: string) {
  finished = true;
  observer.disconnect();
  dispose();
  frame.dataset.scanState = state;
}

reduced.addEventListener("change", () => {
  if (reduced.matches) finish("static");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && started) finish("complete");
  else if (!document.hidden && !started && !finished) {
    observer.unobserve(frame);
    observer.observe(frame);
  }
});
window.addEventListener("pagehide", dispose);
if (reduced.matches) finish("static");
else observer.observe(frame);
