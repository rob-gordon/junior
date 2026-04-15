# Junior — Phase 3 starts here

Phase 2 (swipe, matches, tournament, celebration, AI bulk add, display font) is live at https://junior-harrison-ground-pim-northern.vercel.app. This file is the entry point for the next pass.

## Where Phase 2 left off

The full core loop is shipped end-to-end in production and API-verified. What's *not* verified is any of the visual / gesture / animation work — the entire Sitting 2 session was headless, so the first order of business is a live browser pass on a real phone.

**Verified in Phase 2 (all against the prod URL):**

- `bunx tsc --noEmit` → clean
- `bun run build` → 13 routes, green
- `bun test lib/elo.test.ts` → 5/5 pass
- `GET /api/matches` → returns double-yes names ordered by combined Elo
- `PATCH /api/names/:id/vote` → first yes on a double-yes name returns `{ok:true, match:true}`, idempotent re-vote returns `{ok:true, match:false}` (transition guard on `WHERE col IS NULL OR col != ?` + `RETURNING`), 404 on missing id
- `GET /api/tournament/pair?user=rob&exclude=1,4` → correctly excludes, falls back to unexcluded when exclude kills all rows, returns `{pair:null, reason:"not_enough"}` for N<2
- `POST /api/tournament/result` → Silas 1000→1016, Theo 1000→984 (K=32, conserved; matches `lib/elo.test.ts`)
- `POST /api/names/extract` with `runtime = "nodejs"` → Atticus/Rowan extracted with meaning+origin via `generateText` + `Output.object`, Otis flagged `existing: true` (server-side case-insensitive dedupe against the `names` table)

**DB state to know about:** seeded Silas (id=4) and Theo (id=5) as double-yes test names to exercise tournament. Both start at Elo 1016/984 after a single round. Swipe them to No in the app if you don't want them.

**Stale-data policy (explicit decision from Phase 2):** no polling, no SWR. `/lists` and `/matches` refetch on `visibilitychange` when the tab becomes visible. Good enough for 2 users; documented so future sessions don't treat "add polling" as an obvious TODO.

## What to build next

Roughly in priority order:

- [ ] **Visual verification on a real phone.** Everything below this bullet assumes a live hands-on pass. Install the PWA to the iOS home screen and walk the golden path: identity pick → swipe a few names → create a match (use both Rob and Camille via `localStorage` reset) → watch the celebration → enter tournament → pick winners. Check in particular:
  - `SwipeCard` physics — does the drag feel right? 40% threshold reasonable? Does the exit animation + API latency feel synced, or does the card sit off-screen waiting?
  - Yes/No buttons below the card — tap targets big enough? Accent/sage contrast OK in both light and dark?
  - `NameRow` swipe on Yes/No tabs — this is the risky one. Framer-motion `drag="x"` + `touchAction: pan-y` *should* let vertical scroll pass through, but I didn't confirm it works under a finger. If it conflicts, just drop the NameRow wrapper and render the old `<li>` + buttons (Phase 2 `components/NameRow.tsx` is only referenced from `app/lists/page.tsx`).
  - `MatchCelebration` confetti — does it feel "brief and fun" or too long/too much?
  - `Fraunces` display font on `NameCard` — readable at all three sizes? Font swap is a 1-line change in `components/NameCard.tsx` if it looks wrong.
- [ ] **Real PWA icons.** `public/icons/icon-192x192.png` and `icon-512x512.png` are still solid-terracotta placeholders from Phase 1. Replace with real artwork. (Needs design input — blocker.)
- [ ] **Palette + typography scale polish.** Phase 1 tokens (`#d97757` accent, `#8a9a8b` sage, `#9b9287` muted, `#faf8f5` cream bg) are still live. Tune in `app/globals.css` after visual review. Hand-check dark mode via system preference toggle. WCAG AA contrast check on `--accent` against `--background`.
- [ ] **Gesture tuning pass (after the verification bullet).** If the swipe threshold, velocity triggers, exit duration, or stacked-deck offsets feel off, they're all tweakable in `components/SwipeCard.tsx` (threshold 0.4, velocity 600, exit duration 0.25) and `app/lists/page.tsx` (the stacked `nextName` card at `scale-[0.96] translate-y-3 opacity-80`).
- [ ] **Error state dogfooding.** Phase 2 wired inline errors + Retry everywhere but they've never been triggered in real use. Try: kill network mid-swipe (card should bounce back, name stays in queue), kill network mid-tournament pick, kill network mid-extract (textarea should retain content).
- [ ] **Clean up test data.** Silas and Theo are in prod as placeholder matches. Decide: keep, swipe out, or open a Turso shell and delete.

## Known carryovers / gotchas

- **`AI_GATEWAY_API_KEY`, not `AI_GATEWAY_TOKEN`.** The spec was wrong. Fixed everywhere in Phase 2 (`.env.local`, `.env.example`, `junior-spec.md`, `PHASE-2.md`, Vercel project env vars) but easy to un-fix if someone consults a stale reference.
- **Runtime matters for AI routes.** `app/api/names/extract/route.ts` explicitly declares `export const runtime = "nodejs"`. The gateway needs Node for env vars; edge would fail silently. If you add more AI routes, do the same.
- **Next 16 dynamic route params.** Any new `/api/.../[id]/...` route must use `{ params }: { params: Promise<{ id: string }> }` → `const { id } = await params`. See `app/api/names/[id]/vote/route.ts:6-8`.
- **Vote endpoint returns `{ ok, match }` now, not `{ ok }`.** `lib/api.ts` `voteName` signature is `Promise<{ ok: true; match: boolean }>`. Any caller that destructures this is in `app/lists/page.tsx` currently.
- **Tournament pair avoidance is best-effort, not a hard guarantee.** At N=3 the fallback can still return the excluded pair. This is fine per spec ("avoids repeating") but don't write code that depends on strict non-repeat.
- **framer-motion `drag="x"` default is `touch-action: none`.** `NameRow` overrides to `pan-y` so vertical page scroll still works. If gesture feels off on touch devices, check this first.
- **Turbopack is mandatory** in Next 16 (`bun run dev` uses it). No webpack config.
- **Tailwind v4** uses `@import "tailwindcss"` + `@theme inline { ... }` in `globals.css`. Palette tokens go in CSS, not `tailwind.config.ts` (that file doesn't exist).

## How to resume

1. `bun install` (if fresh checkout).
2. `bun run dev` → `http://localhost:3000`.
3. To reset identity: devtools → Application → Local Storage → delete `junior:user`.
4. To inspect DB: `turso db shell junior "SELECT id, name, rob_vote, camille_vote, rob_elo, camille_elo FROM names;"`.
5. To deploy: `vercel deploy --prod --yes` (linked already).
6. To run tests: `bun test lib/elo.test.ts`.
7. Start from the top of the checklist above — the visual verification pass blocks everything else.

## File map for Phase 3 work

No new files expected. Phase 3 is verification + tuning + icons. Likely-touched files:

- `app/globals.css` — palette, typography scale, dark mode hand-check
- `components/NameCard.tsx` — font size class tuning
- `components/SwipeCard.tsx` — threshold, velocity, exit duration
- `components/NameRow.tsx` — gesture config or removal if it conflicts
- `components/MatchCelebration.tsx` — confetti count, duration, colors
- `public/icons/*.png` — replace placeholders

## Out of scope (still deferred, per spec)

- Service worker / offline caching
- Push notifications
- Authentication
- Name deletion UI (vote-no is the only path)
- Import from external baby name APIs
- Analytics
- Undo on swipe (users fix mistakes from Yes/No tabs)
- Polling / SWR / real-time (explicitly rejected in Phase 2 planning)
- Schema changes (Phase 1 schema still covers everything)
