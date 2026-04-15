import type { User } from "./user";

export type Vote = "yes" | "no";
export type Filter = "new" | "yes" | "no";

export type NameRow = {
  id: number;
  name: string;
  meaning: string | null;
  origin: string | null;
  description: string | null;
  added_at: string;
  rob_vote: Vote | null;
  camille_vote: Vote | null;
  rob_elo: number;
  camille_elo: number;
};

export type NameInput = {
  name: string;
  meaning?: string;
  origin?: string;
  description?: string;
};

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function getNames(user: User, filter: Filter): Promise<{ names: NameRow[] }> {
  const params = new URLSearchParams({ user, filter });
  return jsonFetch(`/api/names?${params.toString()}`);
}

export function addNames(names: NameInput[]): Promise<{ inserted: number }> {
  return jsonFetch("/api/names", {
    method: "POST",
    body: JSON.stringify({ names }),
  });
}

export function voteName(id: number, user: User, vote: Vote): Promise<{ ok: true }> {
  return jsonFetch(`/api/names/${id}/vote`, {
    method: "PATCH",
    body: JSON.stringify({ user, vote }),
  });
}
