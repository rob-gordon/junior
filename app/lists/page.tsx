"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type User } from "@/lib/user";
import { getNames, voteName, type Filter, type NameRow } from "@/lib/api";

const TABS: { id: Filter; label: string }[] = [
  { id: "new", label: "New" },
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

export default function ListsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<Filter>("new");
  const [names, setNames] = useState<NameRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getNames(user, filter)
      .then((res) => {
        if (!cancelled) setNames(res.names);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, filter]);

  async function handleVote(id: number, vote: "yes" | "no") {
    if (!user) return;
    try {
      await voteName(id, user, vote);
      setNames((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex-1 rounded-full py-2 text-sm font-medium border transition ${
              filter === t.id
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-surface text-foreground border-surface-border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filter === "new" && (
        <p className="text-sm text-muted-foreground mb-4">
          {names.length} {names.length === 1 ? "name" : "names"} to sort
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 text-accent p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : names.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {filter === "new"
            ? "All caught up 🎉"
            : filter === "yes"
              ? "No yeses yet."
              : "No nos yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {names.map((n) => (
            <li
              key={n.id}
              className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm"
            >
              <div className="text-3xl font-bold tracking-tight">{n.name}</div>
              {(n.meaning || n.origin) && (
                <div className="text-sm text-muted-foreground mt-1">
                  {[n.origin, n.meaning].filter(Boolean).join(" · ")}
                </div>
              )}
              {n.description && (
                <p className="text-sm mt-2 text-muted-foreground">{n.description}</p>
              )}
              <div className="flex gap-2 mt-4">
                {filter === "new" && (
                  <>
                    <button
                      onClick={() => handleVote(n.id, "no")}
                      className="flex-1 rounded-full border border-surface-border py-2 font-medium"
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleVote(n.id, "yes")}
                      className="flex-1 rounded-full bg-accent text-accent-foreground py-2 font-medium"
                    >
                      Yes
                    </button>
                  </>
                )}
                {filter === "yes" && (
                  <button
                    onClick={() => handleVote(n.id, "no")}
                    className="flex-1 rounded-full border border-surface-border py-2 font-medium"
                  >
                    Move to No
                  </button>
                )}
                {filter === "no" && (
                  <button
                    onClick={() => handleVote(n.id, "yes")}
                    className="flex-1 rounded-full bg-accent text-accent-foreground py-2 font-medium"
                  >
                    Move to Yes
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
