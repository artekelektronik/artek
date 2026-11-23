import { useSyncExternalStore } from "react";

// The visitor's answer to the cookie banner. Statistics tools (Google Analytics, PostHog) load only on "granted".
// null = not answered yet (banner shows); undefined = not known yet (server render), so nothing flashes.
export type Consent = "granted" | "denied" | null;
const KEY = "artek-consent";
const listeners = new Set<() => void>();
let memory: Consent = null; // used when the browser blocks localStorage

export function readConsent(): Consent {
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : memory;
  } catch {
    return memory;
  }
}

export function setConsent(value: Consent) {
  memory = value;
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach(listener => listener());
}

// Asks again: forgets the answer, removes the statistics cookies already set, and reloads so loaded scripts stop.
export function resetConsent() {
  setConsent(null);
  const host = location.hostname;
  const domains = ["", `; domain=${host}`, `; domain=.${host.split(".").slice(-2).join(".")}`];
  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];
    if (/^(_ga|ph_)/.test(name)) for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
  }
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith("ph_")) localStorage.removeItem(key);
  } catch {}
  location.reload();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useConsent(): Consent | undefined {
  return useSyncExternalStore(subscribe, readConsent, () => undefined);
}
