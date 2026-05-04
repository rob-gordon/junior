"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type User } from "@/lib/user";
import { getNames, voteName, type Filter, type NameRow } from "@/lib/api";
import SwipeCard from "@/components/SwipeCard";
import NameCard from "@/components/NameCard";
import SortedNameList from "@/components/SortedNameList";
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
  // The "new" tab still loads via this page; yes/no are owned by SortedNameList.
  const [newNames, setNewNames] = useState<NameRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebratedName, setCelebratedName] = useState<NameRow | null>(null);
  // Incremented to force a re-fetch (used by the Retry button).
  const [reloadSeq, setReloadSeq] = useState(0);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Main fetch for the New tab only. Cancellable.
  useEffect(() => {
    if (!user) return;
    if (filter !== "new") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getNames(user, "new")
      .then((res) => {
        if (cancelled) return;
        setNewNames(res.names);
      })
      .catch((e) => {
        if (cancelled) return;
        setError((e as Error).message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, filter, reloadSeq]);

  // Focus refetch for the New tab only — yes/no lists are paginated and
  // user-driven (search + scroll), so we don't disrupt them on visibility.
  useEffect(() => {
    if (!user) return;
    if (filter !== "new") return;
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      getNames(user!, "new")
        .then((res) => setNewNames(res.names))
        .catch(() => {
          /* silent */
        });
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, filter]);

  async function handleNewVote(id: number, vote: "yes" | "no") {
    if (!user) return;
    const voted = newNames?.find((n) => n.id === id);
    const res = await voteName(id, user, vote);
    setNewNames((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
    if (res.match && voted) {
      setCelebratedName(voted);
    }
  }

  if (!user) return null;

  const names = newNames ?? [];
  const showSkeleton = filter === "new" && loading && !newNames;
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
              setError(null);
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

      {filter === "new" && newNames && (
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {names.length} {names.length === 1 ? "name" : "names"} to sort
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 text-accent p-3 text-sm mb-4 flex items-center justify-between gap-3">
          <span className="truncate">{error}</span>
          <button
            onClick={() => setReloadSeq((n) => n + 1)}
            className="shrink-0 rounded-full border border-accent/60 px-3 py-1 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {filter === "new" ? (
        showSkeleton ? (
          <div className="rounded-2xl border border-surface-border bg-surface h-[360px] animate-pulse" />
        ) : names.length === 0 ? (
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
                  onVote={(vote) => handleNewVote(topName.id, vote)}
                  onError={(e) => setError(e.message)}
                />
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  topName &&
                  handleNewVote(topName.id, "no").catch((e) =>
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
                  handleNewVote(topName.id, "yes").catch((e) =>
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
      ) : (
        <SortedNameList
          key={filter}
          user={user}
          filter={filter}
          onMatch={setCelebratedName}
          onError={(e) => setError(e.message)}
        />
      )}
    </div>
    </>
  );
}
