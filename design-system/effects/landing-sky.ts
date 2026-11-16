import { createShaderSky, type ShaderSkyInstance } from "./shader-sky";

const mount = document.querySelector<HTMLDivElement>("#landing-sky")!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let engine: ShaderSkyInstance | null = null;

function dispose() {
  engine?.destroy();
  engine = null;
  mount.replaceChildren();
}

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
}

reduced.addEventListener("change", render);
document.addEventListener("visibilitychange", render);
window.addEventListener("pagehide", dispose);
window.addEventListener("pageshow", render);
render();
