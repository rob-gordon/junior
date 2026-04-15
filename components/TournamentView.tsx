"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  getTournamentPair,
  recordTournamentResult,
  type NameRow,
} from "@/lib/api";
import type { User } from "@/lib/user";
import NameCard from "./NameCard";

type Props = {
  user: User;
  onExit: () => void;
};

type Pair = [NameRow, NameRow];

export default function TournamentView({ user, onExit }: Props) {
  const [pair, setPair] = useState<Pair | null>(null);
  const [lastPairIds, setLastPairIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notEnough, setNotEnough] = useState(false);
  const [committing, setCommitting] = useState<"left" | "right" | null>(null);

  const fetchNextPair = useCallback(
    async (exclude: number[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getTournamentPair(user, exclude);
        if (res.pair === null) {
          setNotEnough(true);
          setPair(null);
        } else {
          setNotEnough(false);
          setPair(res.pair);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchNextPair([]);
  }, [fetchNextPair]);

  async function pickWinner(side: "left" | "right") {
    if (!pair || committing) return;
    const [left, right] = pair;
    const winner = side === "left" ? left : right;
    const loser = side === "left" ? right : left;
    setCommitting(side);
    try {
      await recordTournamentResult(user, winner.id, loser.id);
      // Brief celebratory hold before next pair.
      await new Promise((r) => setTimeout(r, 350));
      const newExclude = [left.id, right.id];
      setLastPairIds(newExclude);
      setCommitting(null);
      await fetchNextPair(newExclude);
    } catch (e) {
      setError((e as Error).message);
      setCommitting(null);
    }
  }

  async function skip() {
    if (!pair || committing) return;
    const newExclude = [pair[0].id, pair[1].id];
    setLastPairIds(newExclude);
    await fetchNextPair(newExclude);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onExit}
          className="rounded-full border border-surface-border px-4 py-2 text-sm font-medium"
        >
          ← Back
        </button>
        <div className="text-sm text-muted-foreground">Tap your pick</div>
      </div>

      {error && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 text-accent p-3 text-sm mb-4 flex items-center justify-between gap-3">
          <span className="truncate">{error}</span>
          <button
            onClick={() => fetchNextPair(lastPairIds)}
            className="shrink-0 rounded-full border border-accent/60 px-3 py-1 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {notEnough ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Need at least 2 matches to compare.
          </p>
        </div>
      ) : loading && !pair ? (
        <div className="flex-1 flex flex-col gap-4 justify-center">
          <div className="rounded-3xl border border-surface-border bg-surface h-56 animate-pulse" />
          <div className="rounded-3xl border border-surface-border bg-surface h-56 animate-pulse" />
        </div>
      ) : pair ? (
        <div className="flex-1 flex flex-col gap-4 justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pair[0].id}-${pair[1].id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {(["left", "right"] as const).map((side, i) => {
                const name = pair[i];
                const isWinner = committing === side;
                const isLoser = committing && committing !== side;
                return (
                  <motion.button
                    key={name.id}
                    onClick={() => pickWinner(side)}
                    animate={{
                      scale: isWinner ? 1.04 : 1,
                      opacity: isLoser ? 0.25 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl border border-surface-border bg-surface p-8 shadow-md text-center active:scale-[0.98] transition"
                  >
                    <NameCard name={name} size="lg" expanded />
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <button
            onClick={skip}
            disabled={committing !== null || loading}
            className="self-center mt-2 rounded-full border border-surface-border px-5 py-2 text-sm font-medium disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      ) : null}
    </div>
  );
}
