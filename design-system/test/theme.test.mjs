import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../theme.js", import.meta.url), "utf8");
function boot(hour, saved) {
  let now = Date.UTC(2026, 10, 17, hour - 3);
  const listeners = {}, intervals = [], storage = new Map();
  if (saved) storage.set("akdenizos-theme", saved);
  const control = () => ({ value: "", hidden: false, handlers: {}, setAttribute() {}, addEventListener(name, fn) { this.handlers[name] = fn; } });
  const toggle = control(), select = control(), root = { dataset: {} };
  const document = { readyState: "complete", hidden: false, documentElement: root,
    querySelector: () => ({ content: "light" }),
    querySelectorAll: selector => selector === "[data-theme-toggle]" ? [toggle] : selector === "[data-theme-select]" ? [select] : [],
    addEventListener: (name, fn) => { listeners[name] = fn; },
  };
  runInNewContext(source, {
    document, Intl, Date: class extends Date { constructor() { super(now); } },
    window: { addEventListener: (name, fn) => { listeners[name] = fn; } },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    setInterval: fn => intervals.push(fn),
  });
  return { root, toggle, select, storage, listeners, tick(hour) { now = Date.UTC(2026, 10, 17, hour - 3); intervals.forEach(fn => fn()); } };
}

test("automatic scene follows Istanbul boundaries irrespective of the device time zone", () => {
  for (const [hour, scene] of [[0,"night"],[6,"night"],[7,"day"],[16,"day"],[17,"sunset"],[19,"sunset"],[20,"night"],[23,"night"]]) {
    const { root, select } = boot(hour);
    assert.equal(root.dataset.scene, scene, `Istanbul hour ${hour}`);
    assert.equal(root.dataset.theme, scene === "night" ? "dark" : "light");
    assert.equal(select.value, "auto");
  }
});

test("clock follows an open tab while manual selection persists and auto can resume", () => {
  const app = boot(16);
  app.tick(17); assert.equal(app.root.dataset.scene, "sunset");
  app.tick(20); assert.equal(app.root.dataset.scene, "night");
  app.toggle.handlers.click();
  assert.equal(app.storage.get("akdenizos-theme"), "light");
  app.tick(23); assert.equal(app.root.dataset.scene, "day");
  assert.equal(boot(23, "light").root.dataset.scene, "day");
  app.select.value = "auto"; app.select.handlers.change();
  assert.equal(app.storage.has("akdenizos-theme"), false);
  assert.equal(app.root.dataset.scene, "night");
});

test("storage changes synchronize manual preference and visibility refreshes the clock", () => {
  const app = boot(12);
  app.listeners.storage({ key: "akdenizos-theme", newValue: "dark" });
  assert.equal(app.root.dataset.scene, "night");
  app.listeners.storage({ key: "akdenizos-theme", newValue: null });
  assert.equal(app.root.dataset.scene, "day");
  app.tick(18); app.listeners.visibilitychange();
  assert.equal(app.root.dataset.scene, "sunset");
});
