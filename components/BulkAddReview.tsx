"use client";

import { useState } from "react";
import { extractNames, addNames, type ExtractedName } from "@/lib/api";

type Props = {
  onDone: (insertedCount: number) => void;
};

type Phase = "input" | "loading" | "review" | "submitting" | "error";

export default function BulkAddReview({ onDone }: Props) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [extracted, setExtracted] = useState<ExtractedName[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function runExtract() {
    if (!text.trim()) return;
    setPhase("loading");
    setError(null);
    try {
      const res = await extractNames(text);
      setExtracted(res.names);
      // default-select all non-existing
      setSelected(
        new Set(res.names.filter((n) => !n.existing).map((n) => n.name)),
      );
      setPhase("review");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function addSelected() {
    const toAdd = extracted.filter(
      (n) => !n.existing && selected.has(n.name),
    );
    if (toAdd.length === 0) return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await addNames(
        toAdd.map((n) => ({
          name: n.name,
          meaning: n.meaning,
          origin: n.origin,
          description: n.description,
        })),
      );
      onDone(res.inserted);
      setText("");
      setExtracted([]);
      setSelected(new Set());
      setPhase("input");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  function reset() {
    setExtracted([]);
    setSelected(new Set());
    setError(null);
    setPhase("input");
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-semibold">Bulk add from text</h3>

      {phase === "input" && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a list of names, an article, or any text containing baby names."
            rows={6}
            className="rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm resize-y"
          />
          <button
            onClick={runExtract}
            disabled={!text.trim()}
            className="rounded-full bg-accent text-accent-foreground py-3 font-semibold disabled:opacity-50"
          >
            Extract Names
          </button>
        </>
      )}

      {phase === "loading" && (
        <div className="rounded-xl border border-surface-border bg-surface p-8 text-center text-muted-foreground text-sm">
          Asking the AI to extract names…
        </div>
      )}

      {phase === "submitting" && (
        <div className="rounded-xl border border-surface-border bg-surface p-8 text-center text-muted-foreground text-sm">
          Adding…
        </div>
      )}

      {phase === "error" && (
        <>
          <div className="rounded-xl border border-accent/40 bg-accent/10 text-accent p-3 text-sm">
            {error}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setError(null);
                runExtract();
              }}
              className="flex-1 rounded-full bg-accent text-accent-foreground py-3 font-semibold"
            >
              Retry
            </button>
            <button
              onClick={reset}
              className="flex-1 rounded-full border border-surface-border py-3 font-semibold"
            >
              Edit text
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm resize-y"
          />
        </>
      )}

      {phase === "review" && (
        <>
          {extracted.length === 0 ? (
            <div className="rounded-xl border border-surface-border bg-surface p-6 text-center text-sm text-muted-foreground">
              No names found in that text.
              <div className="mt-3">
                <button
                  onClick={reset}
                  className="rounded-full border border-surface-border px-4 py-2 text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Found {extracted.length}{" "}
                {extracted.length === 1 ? "name" : "names"}. Uncheck any you
                don&apos;t want.
              </p>
              <ul className="flex flex-col gap-2">
                {extracted.map((n) => {
                  const checked = selected.has(n.name);
                  const disabled = n.existing;
                  return (
                    <li
                      key={n.name}
                      className={`rounded-xl border border-surface-border p-3 ${
                        disabled ? "bg-surface/50 opacity-60" : "bg-surface"
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked && !disabled}
                          disabled={disabled}
                          onChange={() => toggle(n.name)}
                          className="mt-1.5 accent-accent size-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg">{n.name}</div>
                          {(n.origin || n.meaning) && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {[n.origin, n.meaning]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                          {n.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {n.description}
                            </p>
                          )}
                          {disabled && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              Already added
                            </div>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 rounded-full border border-surface-border py-3 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addSelected}
                  disabled={selected.size === 0}
                  className="flex-[2] rounded-full bg-accent text-accent-foreground py-3 font-semibold disabled:opacity-50"
                >
                  Add Selected ({selected.size})
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
