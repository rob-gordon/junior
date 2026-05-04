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

export type GetNamesOptions = { q?: string; cursor?: string; limit?: number };
export type GetNamesResponse = { names: NameRow[]; nextCursor: string | null };

export function getNames(
  user: User,
  filter: Filter,
  opts: GetNamesOptions = {},
  signal?: AbortSignal,
): Promise<GetNamesResponse> {
  const params = new URLSearchParams({ user, filter });
  if (opts.q) params.set("q", opts.q);
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.limit != null) params.set("limit", String(opts.limit));
  return jsonFetch(`/api/names?${params.toString()}`, { signal });
}

export function addNames(names: NameInput[]): Promise<{ inserted: number }> {
  return jsonFetch("/api/names", {
    method: "POST",
    body: JSON.stringify({ names }),
  });
}

export function voteName(
  id: number,
  user: User,
  vote: Vote,
): Promise<{ ok: true; match: boolean }> {
  return jsonFetch(`/api/names/${id}/vote`, {
    method: "PATCH",
    body: JSON.stringify({ user, vote }),
  });
}

export function getMatches(): Promise<{ names: NameRow[] }> {
  return jsonFetch("/api/matches");
}

export type TournamentPairResponse =
  | { pair: [NameRow, NameRow]; reason?: undefined }
  | { pair: null; reason: "not_enough" };

export function getTournamentPair(
  user: User,
  excludeIds?: number[],
): Promise<TournamentPairResponse> {
  const params = new URLSearchParams({ user });
  if (excludeIds && excludeIds.length > 0) {
    params.set("exclude", excludeIds.join(","));
  }
  return jsonFetch(`/api/tournament/pair?${params.toString()}`);
}

export function recordTournamentResult(
  user: User,
  winnerId: number,
  loserId: number,
): Promise<{ ok: true; winner: number; loser: number }> {
  return jsonFetch("/api/tournament/result", {
    method: "POST",
    body: JSON.stringify({ user, winnerId, loserId }),
  });
}

export type ExtractedName = {
  name: string;
  meaning?: string;
  origin?: string;
  description?: string;
  existing: boolean;
};

export function extractNames(
  text: string,
): Promise<{ names: ExtractedName[] }> {
  return jsonFetch("/api/names/extract", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
