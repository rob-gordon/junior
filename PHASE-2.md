# Junior — Phase 2 starts here

Phase 1 (foundation + thin vertical slice) is done. This file is the entry point for the next pass.

## Where Phase 1 left off

Foundation + single-add + basic vote buttons are working end-to-end against Turso. Identity gate (Rob/Camille via `localStorage`), bottom nav, warm palette, PWA manifest, and Elo helpers (with passing unit tests) are all in. The thin slice is proven: tap "I'm Rob" → `/add` → submit "Otis" → it appears on `/lists` New tab → tap Yes → it moves to the Yes tab and persists in Turso.

**Verified in Phase 1:**

- `bun test lib/elo.test.ts` → 5/5 pass
- `bunx tsc --noEmit` → clean
- `GET /api/names?user=rob&filter=new` → 200
- `POST /api/names` with `{"names":[{"name":"Otis"}]}` → `{"inserted":1}`
- `POST /api/names` with `{"names":[{"name":"otis"}]}` → `{"inserted":0}` (case-insensitive dedupe via `INSERT OR IGNORE` against `UNIQUE COLLATE NOCASE`)
- `PATCH /api/names/1/vote` with `{"user":"rob","vote":"yes"}` → `{"ok":true}` (proves Next 16 async `params` signature)
- `GET /manifest.webmanifest` → valid Junior manifest JSON
- `GET /icons/icon-192x192.png` → 200 (placeholder served)

The Turso DB `junior` is live at `libsql://junior-rob-gordon.aws-us-east-1.turso.io`. Schema is `migrations.sql` at the repo root. Env vars are in `.env.local` (gitignored) and `.env.example` (committed).

## What to build next

Roughly in priority order:

- [ ] **Swipe gestures on `/lists` New tab.** Install a gesture lib (`framer-motion` is the simplest path on React 19; `@use-gesture/react` + `react-spring` per spec is also fine). Build `components/SwipeCard.tsx`: card follows finger, rotates with horizontal drag, opacity Yes/No indicators, ~40% screen-width threshold, spring-back on cancel, exit with momentum, stacked-deck background. Replace the Yes/No buttons on the New tab — keep the buttons as accessibility tap targets per spec.
- [ ] **Yes / No tab swipe-to-move.** Once `SwipeCard` exists, port the same gesture to row entries on the Yes and No tabs (swipe to move to the other bucket).
- [ ] **AI bulk add.** Build `POST /api/names/extract` using the spec's `generateText` + `Output.object` snippet (model string `"anthropic/claude-sonnet-4.5"`, env `AI_GATEWAY_TOKEN` — already wired into `.env.local` as a placeholder, fill in a real token before testing). Build `components/BulkAddReview.tsx` and replace the disabled "Bulk AI add" stub on `/add` with a textarea + extract button + reviewable checklist. Show "Already added" greyed-out rows for names that already exist (you'll need a dedupe check — either client-side after fetching all names, or a new endpoint).
- [ ] **`GET /api/matches`.** Returns names where `rob_vote = 'yes' AND camille_vote = 'yes'`, ordered by `(rob_elo + camille_elo) / 2 DESC`. Wire into `app/matches/page.tsx` as the ranked list view.
- [ ] **Tournament mode.** Build `GET /api/tournament/pair?user=...` (random pair of double-yes names, avoid repeating last pair) and `POST /api/tournament/result` (uses `lib/elo.ts` — already done — and updates the `{user}_elo` columns). Build `components/TournamentView.tsx`: two cards, tap to pick winner, brief animation, next pair, Skip button, Back to ranked list.
- [ ] **Match celebration.** `components/MatchCelebration.tsx` — overlay shown when a Yes vote creates a new match (the other user already voted Yes). Auto-dismiss after 2s. Confetti / particle effect. The vote endpoint will need to return whether the action created a match so the client can trigger the overlay.
- [ ] **Real PWA icons.** Replace the solid-terracotta placeholders in `public/icons/` (192px, 512px) with real artwork.
- [ ] **Display font for name cards.** Phase 1 uses Geist Sans for everything. The spec calls for "one strong display font for names — could be a serif or a distinctive sans-serif, something with character." Pick one via `next/font/google` and apply to the large name text on `SwipeCard`, list rows, and tournament cards.
- [ ] **Polish pass on palette + typography scale.** The Phase 1 colors (`#d97757` accent, `#8a9a8b` sage, `#9b9287` muted, `#faf8f5` cream bg) are reasonable defaults but not designed. Tune in `app/globals.css`.
- [ ] **Vercel deploy.** Add `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AI_GATEWAY_TOKEN` to Vercel project settings. The spec specifies `.vercel.app` hosting.

## Known Next.js 16 gotchas (carried forward)

- **Dynamic route params are `Promise<{...}>`.** See `app/api/names/[id]/vote/route.ts:6` for the working pattern: `{ params }: { params: Promise<{ id: string }> }` → `const { id } = await params`. Any new dynamic route (`/api/tournament/pair` doesn't need this; `/api/names/[id]/...` style does) must follow this.
- **Turbopack is mandatory.** `bun run dev` already uses it. Don't add webpack config.
- **`middleware` is deprecated** in favor of `proxy`. Phase 2 doesn't need either.
- **Tailwind v4** uses `@import "tailwindcss"` + `@theme inline { ... }` in `globals.css`. There is no `tailwind.config.ts` — palette tokens go in CSS.
- **No ORM.** Raw SQL via `@libsql/client` (`lib/db.ts`). Pattern: `db.execute({ sql: "...", args: [...] })`. Returned rows are in `result.rows`.
- **Route Handler `GET` is dynamic by default** in Next 16. Don't bother with `export const dynamic`.

## How to resume

1. `bun install` (if fresh checkout).
2. `bun run dev` — Next dev server on `http://localhost:3000`.
3. To reset identity: open devtools → Application → Local Storage → delete key `junior:user`.
4. To inspect data: `turso db shell junior "SELECT * FROM names;"`.
5. To run the Elo unit tests: `bun test lib/elo.test.ts`.
6. Start from the top of the checklist above.

## File map for Phase 2 work

- New components → `components/SwipeCard.tsx`, `BulkAddReview.tsx`, `TournamentView.tsx`, `MatchCelebration.tsx`, `NameCard.tsx`
- New routes → `app/api/names/extract/route.ts`, `app/api/matches/route.ts`, `app/api/tournament/pair/route.ts`, `app/api/tournament/result/route.ts`
- Touched pages → `app/lists/page.tsx` (swap buttons for swipe), `app/add/page.tsx` (bulk mode), `app/matches/page.tsx` (ranked list + tournament)
- Existing helpers to reuse → `lib/db.ts`, `lib/elo.ts` (already tested), `lib/api.ts` (extend with new fetchers), `lib/user.ts`
