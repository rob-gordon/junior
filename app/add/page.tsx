"use client";

import { useState } from "react";
import { addNames } from "@/lib/api";

export default function AddPage() {
  const [name, setName] = useState("");
  const [meaning, setMeaning] = useState("");
  const [origin, setOrigin] = useState("");
  const [description, setDescription] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setFlash(null);
    setError(null);
    try {
      const res = await addNames([
        {
          name: name.trim(),
          meaning: meaning.trim() || undefined,
          origin: origin.trim() || undefined,
          description: description.trim() || undefined,
        },
      ]);
      setFlash(res.inserted > 0 ? `Added ${name.trim()}` : `${name.trim()} already exists`);
      setName("");
      setMeaning("");
      setOrigin("");
      setDescription("");
      setShowMore(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-8">
      <section>
        <h2 className="text-xl font-bold mb-4">Add a name</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border border-surface-border bg-surface px-4 py-3 text-lg"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-sm text-muted-foreground self-start"
          >
            {showMore ? "− hide details" : "+ add details"}
          </button>
          {showMore && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="Meaning (optional)"
                className="rounded-xl border border-surface-border bg-surface px-4 py-3"
              />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin (optional)"
                className="rounded-xl border border-surface-border bg-surface px-4 py-3"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes (optional)"
                rows={3}
                className="rounded-xl border border-surface-border bg-surface px-4 py-3"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-full bg-accent text-accent-foreground py-3 font-semibold disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add"}
          </button>
          {flash && <p className="text-sm text-sage">{flash}</p>}
          {error && <p className="text-sm text-accent">{error}</p>}
        </form>
      </section>

      <section className="rounded-2xl border border-dashed border-surface-border p-5 text-center text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-1">Bulk AI add</h3>
        <p className="text-sm">Coming in Phase 2.</p>
      </section>
    </div>
  );
}
