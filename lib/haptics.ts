// Light "tick" feedback while scrolling the timeline.
// - Android Chrome: Vibration API (only after the visitor has tapped the page once).
// - iOS Safari 18+: no Vibration API; toggling a hidden <input switch> plays the system haptic.
// - Everywhere else: silently does nothing.

let iosSwitch: HTMLLabelElement | null = null;
let last = 0;

function ensureIosSwitch() {
  if (iosSwitch || typeof document === "undefined") return iosSwitch;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;overflow:hidden;";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  label.appendChild(input);
  document.body.appendChild(label);
  iosSwitch = label;
  return label;
}

export function hapticTick() {
  const now = performance.now();
  if (now - last < 70) return;
  last = now;
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(8);
    return;
  }
  ensureIosSwitch()?.click();
}
