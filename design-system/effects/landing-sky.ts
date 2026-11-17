import { createShaderSky, type ShaderSkyInstance } from "./shader-sky";

const mount = document.querySelector<HTMLDivElement>("#landing-sky")!;
const photo = document.querySelector<HTMLImageElement>(".hero-photo img")!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let engine: ShaderSkyInstance | null = null;

function dispose() {
  engine?.destroy();
  engine = null;
  mount.replaceChildren();
  mount.removeAttribute("data-ready");
}

function alignSky() {
  const box = photo.getBoundingClientRect();
  const scale = Math.max(box.width / 1400, box.height / 1867);
  const position = parseFloat(getComputedStyle(photo).objectPosition.split(" ")[1]) / 100;
  const crop = (1867 * scale - box.height) * position;
  // Ufuk cizgisinden once erir; dag, deniz ve palmiyeler fotografa aittir.
  const end = Math.max(0, Math.min(box.height, 900 * scale - crop));
  const start = Math.max(0, 780 * scale - crop);
  mount.style.setProperty("--sky-height", `${end}px`);
  mount.style.setProperty("--sky-fade-start", `${Math.min(start, end)}px`);
}

const resize = new ResizeObserver(alignSky);
resize.observe(photo);
alignSky();

function render() {
  dispose();
  if (reduced.matches || document.hidden) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  mount.append(canvas);
  engine = createShaderSky(canvas, {
    speed: 0.07,
    coverage: 0.4,
    amount: 0.4,
    lightning: false,
    interactive: true,
    gradient: true,
  });
  if (!engine) mount.replaceChildren();
  else requestAnimationFrame(() => mount.setAttribute("data-ready", ""));
}

reduced.addEventListener("change", render);
document.addEventListener("visibilitychange", render);
window.addEventListener("pagehide", dispose);
window.addEventListener("pageshow", render);
render();
