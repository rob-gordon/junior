"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, type User } from "@/lib/user";
import { getMatches, type NameRow } from "@/lib/api";
import NameCard from "@/components/NameCard";
import TournamentView from "@/components/TournamentView";

type Mode = "list" | "tournament";

export default function MatchesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [names, setNames] = useState<NameRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const refetch = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await getMatches();
      setNames(res.names);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch(true);
  }, [refetch]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") refetch(false);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  if (!user) return null;

  if (mode === "tournament") {
    return (
      <TournamentView
        user={user}
        onExit={() => {
          setMode("list");
          refetch(false);
        }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      <h2 className="text-2xl font-bold mb-6">Matches</h2>

      {error && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 text-accent p-3 text-sm mb-4 flex items-center justify-between gap-3">
          <span className="truncate">{error}</span>
          <button
            onClick={() => refetch(true)}
            className="shrink-0 rounded-full border border-accent/60 px-3 py-1 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {loading && names.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-surface-border bg-surface h-20 animate-pulse"
            />
          ))}
        </div>
      ) : names.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No matches yet. Keep swiping!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {names.map((n, i) => {
            const combined = Math.round((n.rob_elo + n.camille_elo) / 2);
            return (
              <li
                key={n.id}
                className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-bold text-muted-foreground min-w-[2ch] tabular-nums">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <NameCard
                      name={n}
                      size="md"
                      expanded={expandedId === n.id}
                      onToggle={() =>
                        setExpandedId(expandedId === n.id ? null : n.id)
                      }
                    />
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {combined}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {names.length >= 2 && (
        <button
          onClick={() => setMode("tournament")}
          className="fixed bottom-24 right-6 rounded-full bg-accent text-accent-foreground px-6 py-3 font-semibold shadow-lg active:scale-[0.98] transition"
        >
          Compare
        </button>
      )}
    </div>
  );
}
