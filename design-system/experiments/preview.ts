import { createShaderSky } from "../effects/shader-sky";
import { createShaderGradient } from "../effects/shader-gradient";
import { createRadiantLines } from "../effects/radiant-lines";
import {
  createDitherScan,
  type DitherScanInstance,
} from "../effects/dither-scan";
import {
  createStretchyFooter,
  type StretchyFooterInstance,
} from "../effects/stretchy-footer";

type Mode = "shader-sky" | "shader-gradient" | "radiant-lines" | "none";
type Disposable = { destroy: () => void };
const modes: Mode[] = [
  "shader-sky",
  "shader-gradient",
  "radiant-lines",
  "none",
];
const requested = new URLSearchParams(location.search).get("effect");
let mode: Mode = modes.includes(requested as Mode)
  ? (requested as Mode)
  : "shader-sky";
let paused = false;
let hero: Disposable | null = null;
let scan: DitherScanInstance | null = null;
let footer: StretchyFooterInstance | null = null;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
const heroMount = document.querySelector<HTMLDivElement>("#hero-effect")!;
const scanMount = document.querySelector<HTMLDivElement>("#scan-effect")!;
const footerMount = document.querySelector<HTMLDivElement>("#footer-effect")!;
const motionButton =
  document.querySelector<HTMLButtonElement>("#motion-toggle")!;
const replayButton = document.querySelector<HTMLButtonElement>("#scan-replay")!;
const footerButton = document.querySelector<HTMLButtonElement>("#footer-play")!;
const status = document.querySelector<HTMLParagraphElement>("#effect-status")!;
const scanStatus = document.querySelector<HTMLElement>("#scan-status")!;
const footerStatus = document.querySelector<HTMLElement>("#footer-status")!;
const choices = document.querySelectorAll<HTMLButtonElement>("[data-effect]");
const names: Record<Mode, string> = {
  "shader-sky": "Shader Sky",
  "shader-gradient": "Shader Gradient",
  "radiant-lines": "Radiant Lines",
  none: "Efektsiz fotoğraf",
};

function dispose() {
  hero?.destroy();
  scan?.destroy();
  footer?.destroy();
  hero = scan = footer = null;
  heroMount.replaceChildren();
  scanMount.replaceChildren();
  footerMount.replaceChildren();
}

function canvasAt(parent: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  parent.append(canvas);
  return canvas;
}

function render() {
  dispose();
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : systemTheme.matches;
  const theme = dark ? "dark" : "light";
  const tokens = getComputedStyle(document.documentElement);
  const color = (name: string) => tokens.getPropertyValue(name).trim();
  const palette = [
    color("--accent"),
    color("--surface"),
    color("--paper"),
    color("--button"),
  ];
  const staticView = paused || reduced.matches;
  const inactive = staticView || document.hidden;
  choices.forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.effect === mode)),
  );
  motionButton.disabled = reduced.matches;
  motionButton.replaceChildren(
    document.createTextNode(
      reduced.matches
        ? "Hareket azaltma açık"
        : paused
          ? "Hareketi aç"
          : "Hareketi durdur",
    ),
  );
  replayButton.disabled = inactive;
  footerButton.disabled = inactive;
  heroMount.dataset.mode = mode;
  heroMount.dataset.renderState = inactive ? "static" : "active";
  scanStatus.textContent = inactive
    ? "Fotoğraf statik gösteriliyor."
    : "Fotoğraf hazırlanıyor.";
  footerStatus.textContent = staticView
    ? "Hareket kapalıyken footer sabit kalır."
    : "Sayfanın sonunda biraz daha kaydırabilirsin.";
  if (inactive) {
    status.textContent = reduced.matches
      ? "Sistem tercihi nedeniyle efektler statik gösteriliyor."
      : paused
        ? "Hareket durduruldu. Statik fotoğraflar gösteriliyor."
        : "Sekme görünür olduğunda deneme devam eder.";
    return;
  }

  if (mode !== "none") {
    const canvas = canvasAt(heroMount);
    if (mode === "shader-sky")
      hero = createShaderSky(canvas, {
        theme,
        speed: 0.07,
        coverage: 0.4,
        amount: 0.4,
        lightning: false,
      });
    else if (mode === "shader-gradient")
      hero = createShaderGradient(canvas, {
        theme,
        colors: palette,
        speed: 0.08,
        intensity: 0.7,
        grain: 0.12,
        interactive: true,
      });
    else
      hero = createRadiantLines(canvas, {
        theme,
        colors: [palette[0], color("--muted"), palette[3]],
        starCount: 180,
        displacement: 0.6,
      });
    if (!hero) {
      canvas.remove();
      heroMount.dataset.renderState = "fallback";
    }
  }
  status.textContent =
    mode === "none"
      ? "Efektsiz Antalya fotoğrafı. Görsel ve eylemleri karşılaştır."
      : hero
        ? names[mode] + " çalışıyor. İstersen hareketi durdurabilirsin."
        : "Bu tarayıcıda efekt başlatılamadı; Antalya fotoğrafı gösteriliyor.";

  scan = createDitherScan(scanMount, canvasAt(scanMount), {
    src: "../../assets/images/kaleici.jpg",
    theme,
    colors: [color("--ink"), color("--paper")],
    passes: 2,
    duration: 900,
    pause: 120,
    loop: false,
    onStart: () => {
      scanStatus.textContent = "Tarama başladı.";
    },
    onPass: (pass, total) => {
      scanStatus.textContent = `${pass} / ${total} geçiş tamamlandı.`;
    },
    onComplete: () => {
      scanStatus.textContent =
        "Tarama tamamlandı. Normal fotoğraf gösteriliyor.";
    },
  });
  if (!scan) {
    scanMount.replaceChildren();
    scanStatus.textContent =
      "Efekt başlatılamadı; normal fotoğraf gösteriliyor.";
    replayButton.disabled = true;
  }

  footer = createStretchyFooter(
    {
      canvas: canvasAt(footerMount),
      scroller: window,
      content: "[data-stretchy-page]",
    },
    {
      colors: [palette[0], palette[1], palette[3]],
      maxStretch: 180,
      blur: 12,
      columns: 7,
      demoId: "akdenizos",
    },
  );
  footerButton.disabled = !footer;
}

choices.forEach((button) =>
  button.addEventListener("click", () => {
    mode = button.dataset.effect as Mode;
    const url = new URL(location.href);
    url.searchParams.set("effect", mode);
    history.replaceState(null, "", url);
    render();
  }),
);
motionButton.addEventListener("click", () => {
  paused = !paused;
  render();
});
replayButton.addEventListener("click", () => {
  if (!reduced.matches && !paused) scan?.replay();
});
footerButton.addEventListener("click", () => {
  if (reduced.matches || paused || !footer) return;
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "instant",
  });
  footer.play({ amount: 0.8, holdMs: 650 });
  footerStatus.textContent = "Footer bir kez esniyor ve yerine dönüyor.";
});
const themeObserver = new MutationObserver(render);
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
systemTheme.addEventListener("change", render);
reduced.addEventListener("change", render);
document.addEventListener("visibilitychange", render);
window.addEventListener("pagehide", dispose);
render();
