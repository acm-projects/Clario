import { useSyncExternalStore } from "react";

export type Appearance = "light" | "dark";
// Only explicit choices in Settings persist. Ignore the legacy shared interview toggle.
const key = "clario-settings-appearance";
let fallback: Appearance = "light";

function read(): Appearance {
  try { return localStorage.getItem(key) === "dark" ? "dark" : "light"; }
  catch { return fallback; }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("clario:appearance", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("clario:appearance", callback);
  };
}

export function setAppearance(value: Appearance) {
  fallback = value;
  try { localStorage.setItem(key, value); } catch { /* Keep the current tab usable without storage. */ }
  window.dispatchEvent(new Event("clario:appearance"));
}

export function useAppearance() {
  return useSyncExternalStore(subscribe, read, () => "light" as Appearance);
}
