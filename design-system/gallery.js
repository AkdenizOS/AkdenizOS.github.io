(() => {
  const updateValues = () => {
    const tokens = getComputedStyle(document.documentElement);
    document.querySelectorAll("[data-token-value]").forEach((element) => {
      element.textContent = tokens
        .getPropertyValue(element.dataset.tokenValue)
        .trim();
    });
  };
  const observer = new MutationObserver(updateValues);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    updateValues,
  );
  document.querySelector("[data-demo-action]").addEventListener("click", () => {
    document.querySelector("#demo-status").textContent =
      "Örnek eylem çalıştı. Bu, bileşenin etkileşim gösterimidir.";
  });
  updateValues();
})();
