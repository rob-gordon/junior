// Tracks whether this device has seen the first-run intro. Versioned so the
// flow can be re-shown to everyone later by bumping the suffix.
const KEY = "junior:onboarded:v1";

export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function markOnboarded(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, "1");
}

export function resetOnboarded(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
