export type User = "rob" | "camille";

const KEY = "junior:user";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(KEY);
  return value === "rob" || value === "camille" ? value : null;
}

export function setCurrentUser(user: User): void {
  window.localStorage.setItem(KEY, user);
}

export function clearCurrentUser(): void {
  window.localStorage.removeItem(KEY);
}
