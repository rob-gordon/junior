"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { getNames, voteName, type NameRow } from "@/lib/api";
import type { User } from "@/lib/user";
import NameRowCard from "./NameRow";

type Props = {
  user: User;
  filter: "yes" | "no" | "reconsider";
  onMatch: (name: NameRow) => void;
  onError: (err: Error) => void;
  onAfterVote?: () => void;
};

const PAGE_SIZE = 50;

const FILTER_CONFIG = {
  yes: {
    swipeDirection: "left" as const,
    moveLabel: "Move to No",
    moveTarget: "no" as const,
    moveBtnClass:
      "flex-1 rounded-full border border-surface-border py-2 text-sm font-medium",
    searchPlaceholder: "Search yeses…",
    emptyPrimary: "No yeses yet.",
    emptySub: null as string | null,
  },
  no: {
    swipeDirection: "right" as const,
    moveLabel: "Move to Yes",
    moveTarget: "yes" as const,
    moveBtnClass:
      "flex-1 rounded-full bg-accent text-accent-foreground py-2 text-sm font-medium",
    searchPlaceholder: "Search nos…",
    emptyPrimary: "No nos yet.",
    emptySub: null as string | null,
  },
  reconsider: {
    swipeDirection: "right" as const,
    moveLabel: "Move to Yes",
    moveTarget: "yes" as const,
    moveBtnClass:
      "flex-1 rounded-full bg-sage text-white py-2 text-sm font-medium",
    searchPlaceholder: "",
    emptyPrimary: "No second looks pending.",
    emptySub: null as string | null,
  },
};

export default function SortedNameList({
  user,
  filter,
  onMatch,
  onError,
  onAfterVote,
}: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [names, setNames] = useState<NameRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Stable refs for parent callbacks so they don't trigger refetch loops.
  const onErrorRef = useRef(onError);
  const onMatchRef = useRef(onMatch);
  const onAfterVoteRef = useRef(onAfterVote);
  useEffect(() => {
    onErrorRef.current = onError;
    onMatchRef.current = onMatch;
    onAfterVoteRef.current = onAfterVote;
  });

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Initial / search-change fetch. Cancellable.
  useEffect(() => {
    const ctrl = new AbortController();
    setLoadingInitial(true);
    setExpandedId(null);
    getNames(user, filter, { q: debouncedQuery, limit: PAGE_SIZE }, ctrl.signal)
      .then((res) => {
        setNames(res.names);
        setNextCursor(res.nextCursor);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        onErrorRef.current(e as Error);
      })
      .finally(() => {
        if (ctrl.signal.aborted) return;
        setLoadingInitial(false);
      });
    return () => ctrl.abort();
  }, [user, filter, debouncedQuery]);

  // Track in-flight loadMore to prevent double-fires.
  const loadingMoreRef = useRef(false);
  async function loadMore() {
    if (loadingMoreRef.current || !nextCursor) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await getNames(user, filter, {
        q: debouncedQuery,
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      setNames((prev) => {
        // Guard against duplicates if the cursor returns overlap.
        const seen = new Set(prev.map((n) => n.id));
        const merged = [...prev];
        for (const n of res.names) if (!seen.has(n.id)) merged.push(n);
        return merged;
      });
      setNextCursor(res.nextCursor);
    } catch (e) {
      onErrorRef.current(e as Error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  async function handleVote(id: number, vote: "yes" | "no") {
    const target = names.find((n) => n.id === id);
    setNames((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await voteName(id, user, vote);
      if (res.match && target) onMatchRef.current(target);
      onAfterVoteRef.current?.();
    } catch (e) {
      // Restore on failure so the user can retry.
      if (target) {
        setNames((prev) => {
          if (prev.some((n) => n.id === target.id)) return prev;
          return [target, ...prev];
        });
      }
      onErrorRef.current(e as Error);
    }
  }

  // Window virtualizer needs to know the offset of the list container from the
  // top of the document, otherwise scroll math is wrong (the list lives below
  // the page header, tabs, and search input).
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    if (!listRef.current) return;
    const update = () => {
      if (listRef.current) {
        setScrollMargin(
          listRef.current.getBoundingClientRect().top + window.scrollY,
        );
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [loadingInitial]);

  const virtualizer = useWindowVirtualizer({
    count: names.length,
    estimateSize: () => 132,
    overscan: 6,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Trigger pagination when we render rows near the end.
  useEffect(() => {
    if (!nextCursor || loadingMore || names.length === 0) return;
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= names.length - 5) {
      void loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualItems, nextCursor, loadingMore, names.length]);

  const cfg = FILTER_CONFIG[filter];
  const { swipeDirection, moveLabel, moveTarget, moveBtnClass } = cfg;
  const partnerLabel = user === "rob" ? "Camille" : "Rob";
  const partnerHeader = `Names ${partnerLabel} loves`;
  const reconsiderSub = `Nothing new from ${partnerLabel} right now.`;

  return (
    <div>
      {filter === "reconsider" ? (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {partnerHeader}
          </p>
        </div>
      ) : (
        <div className="relative mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={cfg.searchPlaceholder}
            aria-label="Search names"
            className="w-full rounded-full border border-surface-border bg-surface text-foreground placeholder:text-muted-foreground py-2.5 pl-4 pr-10 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full text-muted-foreground hover:bg-surface-border/60"
            >
              ×
            </button>
          )}
        </div>
      )}

      {loadingInitial ? (
        <div className="rounded-2xl border border-surface-border bg-surface h-[360px] animate-pulse" />
      ) : names.length === 0 ? (
        debouncedQuery ? (
          <p className="text-center text-muted-foreground py-12">
            No matches for &ldquo;{debouncedQuery}&rdquo;.
          </p>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{cfg.emptyPrimary}</p>
            {filter === "reconsider" && (
              <p className="text-sm text-muted-foreground mt-2">
                {reconsiderSub}
              </p>
            )}
          </div>
        )
      ) : (
        <>
          <div
            ref={listRef}
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {virtualItems.map((vi) => {
              const n = names[vi.index];
              return (
                <div
                  key={n.id}
                  ref={virtualizer.measureElement}
                  data-index={vi.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vi.start - scrollMargin}px)`,
                    paddingBottom: 12,
                  }}
                >
                  <NameRowCard
                    name={n}
                    swipeDirection={swipeDirection}
                    expanded={expandedId === n.id}
                    onToggle={() =>
                      setExpandedId(expandedId === n.id ? null : n.id)
                    }
                    onCommit={() => handleVote(n.id, moveTarget)}
                    onError={(e) => onErrorRef.current(e)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        handleVote(n.id, moveTarget).catch((e) =>
                          onErrorRef.current(e as Error),
                        )
                      }
                      className={moveBtnClass}
                    >
                      {moveLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {loadingMore && (
            <p className="text-center text-muted-foreground text-sm py-4">
              Loading more…
            </p>
          )}
        </>
      )}
    </div>
  );
}
