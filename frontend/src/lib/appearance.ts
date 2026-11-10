import { useSyncExternalStore } from "react";

export type Appearance = "light" | "dark";
// Only Settings changes the application-wide appearance.
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

const sandboxKey = "clario-sandbox-appearance";
let sandboxFallback: Appearance | undefined;

function readSandbox(): Appearance {
  try {
    const value = localStorage.getItem(sandboxKey);
    return value === "light" || value === "dark" ? value : read();
  } catch { return sandboxFallback ?? read(); }
}

function subscribeSandbox(callback: () => void) {
  const unsubscribe = subscribe(callback);
  window.addEventListener("clario:sandbox-appearance", callback);
  return () => { unsubscribe(); window.removeEventListener("clario:sandbox-appearance", callback); };
}

export function setSandboxAppearance(value: Appearance) {
  sandboxFallback = value;
  try { localStorage.setItem(sandboxKey, value); } catch { /* Keep sandbox controls usable without storage. */ }
  window.dispatchEvent(new Event("clario:sandbox-appearance"));
}

export function useSandboxAppearance() {
  return useSyncExternalStore(subscribeSandbox, readSandbox, () => "light" as Appearance);
}
