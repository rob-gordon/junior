export type User = "user1" | "user2"; // "slots", not people — display names come from lib/participants

const KEY = "junior:user";

export function isUser(v: string | null): v is User {
  return v === "user1" || v === "user2";
}

export function partnerOf(user: User): User {
  return user === "user1" ? "user2" : "user1";
}

// One source of truth for slot -> DB column. Keeps SQL column selection off string interpolation.
export const VOTE_COL = { user1: "user1_vote", user2: "user2_vote" } as const;
export const ELO_COL = { user1: "user1_elo", user2: "user2_elo" } as const;

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(KEY);
  if (value === "user1" || value === "user2") return value;
  // Back-compat for Rob & Camille's existing devices so they don't have to re-pick after the upgrade.
  if (value === "rob") return "user1";
  if (value === "camille") return "user2";
  return null;
}

export function setCurrentUser(user: User): void {
  window.localStorage.setItem(KEY, user);
}

export function clearCurrentUser(): void {
  window.localStorage.removeItem(KEY);
}
