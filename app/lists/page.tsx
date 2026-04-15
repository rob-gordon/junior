"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, type User } from "@/lib/user";
import { getNames, voteName, type Filter, type NameRow } from "@/lib/api";
import SwipeCard from "@/components/SwipeCard";
import NameCard from "@/components/NameCard";
import NameRowCard from "@/components/NameRow";
import MatchCelebration from "@/components/MatchCelebration";
import { AnimatePresence } from "framer-motion";

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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [celebratedName, setCelebratedName] = useState<NameRow | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const refetch = useCallback(
    async (showLoading = false) => {
      if (!user) return;
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const res = await getNames(user, filter);
        setNames(res.names);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user, filter],
  );

  useEffect(() => {
    if (!user) return;
    refetch(true);
  }, [user, filter, refetch]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") refetch(false);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  async function handleVote(id: number, vote: "yes" | "no") {
    if (!user) return;
    const voted = names.find((n) => n.id === id);
    const res = await voteName(id, user, vote);
    setNames((prev) => prev.filter((n) => n.id !== id));
    if (res.match && voted) {
      setCelebratedName(voted);
    }
  }

  if (!user) return null;

  const topName = names[0];
  const nextName = names[1];

  return (
    <>
      <AnimatePresence>
        {celebratedName && (
          <MatchCelebration
            name={celebratedName}
            onDismiss={() => setCelebratedName(null)}
          />
        )}
      </AnimatePresence>
    <div className="max-w-md mx-auto px-4 pt-6 pb-8">
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setFilter(t.id);
              setExpandedId(null);
            }}
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
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {names.length} {names.length === 1 ? "name" : "names"} to sort
        </p>
      )}

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
        <div className="rounded-2xl border border-surface-border bg-surface h-[360px] animate-pulse" />
      ) : filter === "new" ? (
        names.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-lg">
            All caught up 🎉
          </p>
        ) : (
          <>
            <div className="relative h-[420px] mb-6">
              {nextName && (
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-3xl border border-surface-border bg-surface shadow-md p-8 flex items-center justify-center scale-[0.96] translate-y-3 opacity-80"
                >
                  <div className="w-full text-center">
                    <NameCard name={nextName} size="lg" expanded />
                  </div>
                </div>
              )}
              {topName && (
                <SwipeCard
                  key={topName.id}
                  name={topName}
                  onVote={(vote) => handleVote(topName.id, vote)}
                  onError={(e) => setError(e.message)}
                />
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  topName &&
                  handleVote(topName.id, "no").catch((e) =>
                    setError((e as Error).message),
                  )
                }
                className="flex-1 rounded-full border-2 border-accent text-accent py-3 font-semibold active:scale-[0.98] transition"
              >
                No
              </button>
              <button
                onClick={() =>
                  topName &&
                  handleVote(topName.id, "yes").catch((e) =>
                    setError((e as Error).message),
                  )
                }
                className="flex-1 rounded-full bg-sage text-white py-3 font-semibold active:scale-[0.98] transition"
              >
                Yes
              </button>
            </div>
          </>
        )
      ) : names.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {filter === "yes" ? "No yeses yet." : "No nos yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {names.map((n) => {
            const targetVote = filter === "yes" ? "no" : "yes";
            const swipeDirection = filter === "yes" ? "left" : "right";
            return (
              <li key={n.id}>
                <NameRowCard
                  name={n}
                  swipeDirection={swipeDirection}
                  expanded={expandedId === n.id}
                  onToggle={() =>
                    setExpandedId(expandedId === n.id ? null : n.id)
                  }
                  onCommit={() => handleVote(n.id, targetVote)}
                  onError={(e: Error) => setError(e.message)}
                />
                <div className="flex gap-2 mt-2">
                  {filter === "yes" && (
                    <button
                      onClick={() =>
                        handleVote(n.id, "no").catch((e) =>
                          setError((e as Error).message),
                        )
                      }
                      className="flex-1 rounded-full border border-surface-border py-2 text-sm font-medium"
                    >
                      Move to No
                    </button>
                  )}
                  {filter === "no" && (
                    <button
                      onClick={() =>
                        handleVote(n.id, "yes").catch((e) =>
                          setError((e as Error).message),
                        )
                      }
                      className="flex-1 rounded-full bg-accent text-accent-foreground py-2 text-sm font-medium"
                    >
                      Move to Yes
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </>
  );
}
