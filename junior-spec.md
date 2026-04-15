# Junior — Baby Name App

A PWA for Rob and Camille to collaboratively choose a baby name. Built around quick micro-decisions: swipe yes/no on a shared pool of names, then run head-to-head tournaments on the shortlist to find a winner.

---

## Users

Two hardcoded users: **Rob** and **Camille**. On first visit, the user taps "I'm Rob" or "I'm Camille." Selection is stored in `localStorage` and never asked again. No authentication, no passwords.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + TypeScript |
| Routing | Next.js App Router (file-system routing) |
| Styling | Tailwind CSS |
| Database | Turso (libSQL) — fresh instance |
| ORM | None. Raw SQL via `@libsql/client`. Single `migrations.sql` file run manually against the DB. |
| AI | Vercel AI SDK (`ai` package) with Zod. Model: `"anthropic/claude-sonnet-4.5"` as a plain string. Env var: `AI_GATEWAY_API_KEY`. Use `generateText` + `Output.object` for structured output. **Do not install a separate provider package.** |
| Hosting | Vercel (`.vercel.app` domain) |
| PWA | Built-in Next.js manifest via `app/manifest.ts`. No third-party PWA package. Add to Home Screen only. No offline support. No service worker. No push notifications. Show a "No internet connection" banner when offline. |

### Local Development

Local dev hits the production Turso database. No local SQLite, no dev seeds.

### Next.js Notes

- All page components are client components (`"use client"`) since the app is fully interactive.
- No SSR needed — pages can `useEffect` to fetch data client-side, or use Route Handlers as a thin API layer.
- The PWA manifest is a single `app/manifest.ts` file that Next.js auto-links in the HTML `<head>`:

```ts
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Junior',
    short_name: 'Junior',
    description: 'Baby name picker for Rob & Camille',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#faf8f5',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

---

## Database Schema

```sql
-- migrations.sql

CREATE TABLE IF NOT EXISTS names (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  meaning TEXT,
  origin TEXT,
  description TEXT,        -- freeform notes / AI-extracted context
  added_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Votes: 'yes' | 'no' | NULL (unsorted)
  rob_vote TEXT CHECK (rob_vote IN ('yes', 'no')),
  camille_vote TEXT CHECK (camille_vote IN ('yes', 'no')),

  -- Elo ratings for tournament (only meaningful when both votes = 'yes')
  rob_elo REAL NOT NULL DEFAULT 1000,
  camille_elo REAL NOT NULL DEFAULT 1000
);
```

**Key constraints:**
- `name` is unique and case-insensitive (`COLLATE NOCASE`). "Margot" and "margot" are the same.
- Names are never deleted. Voting "no" is the only way to dismiss a name.
- Elo scores persist even if a user flips their vote to "no." If they flip back to "yes," the name re-enters the Matches pool with its previous Elo intact.

---

## API Routes

All routes are Next.js Route Handlers in the `app/api/` directory. JSON request/response.

### Names

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/names?user={rob\|camille}&filter={new\|yes\|no}` | Get names filtered by the given user's vote status. `new` = vote is NULL. |
| `POST` | `/api/names` | Add one or more names. Body: `{ names: [{ name, meaning?, origin?, description? }] }`. Deduplicates silently — already-existing names are skipped, no error. |
| `PATCH` | `/api/names/:id/vote` | Set vote. Body: `{ user: "rob" | "camille", vote: "yes" | "no" }`. |

### AI Bulk Add

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/names/extract` | AI extraction. Body: `{ text: string }`. Returns `{ names: [{ name, meaning?, origin?, description? }] }`. Does **not** insert into DB — client reviews first. |

#### AI Extraction Prompt

The `/api/names/extract` endpoint uses `generateText` + `Output.object`:

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

const NameSchema = z.object({
  name: z.string().describe("The baby name, capitalized properly"),
  meaning: z.string().optional().describe("Meaning of the name if mentioned or known"),
  origin: z.string().optional().describe("Cultural or linguistic origin if mentioned or known"),
  description: z.string().optional().describe("Any other context from the source text about this name"),
});

const { output } = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  output: Output.object({
    schema: z.object({
      names: z.array(NameSchema),
    }),
  }),
  prompt: `Extract all baby boy names from the following text. For each name, include its meaning, origin, and any other relevant context mentioned. Only extract names — do not invent information not present or implied in the text.\n\nText:\n${userText}`,
});
```

Env: `AI_GATEWAY_API_KEY` (not `ANTHROPIC_API_KEY`).

### Tournament

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tournament/pair?user={rob\|camille}` | Returns two random matched names (both users voted yes) for head-to-head comparison. Selection is random but avoids repeating the same pair consecutively. |
| `POST` | `/api/tournament/result` | Body: `{ user, winnerId, loserId }`. Updates Elo for both names using standard Elo formula (K=32). |

### Matches

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/matches` | Returns all names where `rob_vote = 'yes' AND camille_vote = 'yes'`, ordered by combined Elo `(rob_elo + camille_elo) / 2` descending. |

---

## Elo System

Standard Elo with K-factor = 32.

```
Expected score: E = 1 / (1 + 10^((opponent_elo - player_elo) / 400))
New rating:     R' = R + K * (S - E)
  where S = 1 for win, 0 for loss
```

Each user has independent Elo scores per name. The combined ranking on the Matches screen is the average: `(rob_elo + camille_elo) / 2`.

Starting Elo for all names: **1000**.

---

## Screens & Navigation

**Bottom nav** with three tabs: **My Lists**, **Add**, **Matches**.

### 1. My Lists

Three sub-tabs at the top of the screen: **New** | **Yes** | **No**

#### New Tab (Swipe Screen)
- Shows one name at a time, large and centered. Name text should be bold and scale to fill the card width.
- Below the name: meaning, origin, and description if available (smaller text).
- Card UI with swipe-to-dismiss:
  - **Swipe right** → vote Yes. Card slides off to the right.
  - **Swipe left** → vote No. Card slides off to the left.
  - Also provide **tap targets** (Yes / No buttons) for accessibility.
- Next card animates in from below or fades in.
- Counter at top: "14 names to sort"
- Empty state: "All caught up 🎉"
- No undo button. Users fix mistakes from their Yes/No tabs.

#### Yes Tab
- Scrollable list of names you've voted Yes on.
- Each row shows the name (large) and a button/swipe to move it to No.
- Tapping a name expands to show meaning/origin/description.

#### No Tab
- Same layout as Yes tab.
- Each row has a button/swipe to move it back to Yes.

### 2. Add

Two modes:

#### Single Add
- Text input at the top. Type a name, tap Add.
- Optional fields below: meaning, origin, description (collapsed by default, expandable).

#### Bulk Add (AI)
- Large textarea: "Paste a list of names, an article, or any text containing baby names."
- "Extract Names" button → hits `/api/names/extract`.
- Loading state while AI processes.
- Results appear as a reviewable checklist:
  - Each name shown with a checkbox (all checked by default), plus extracted meaning/origin/description.
  - Names that already exist in the DB are shown as greyed out / unchecked with a "Already added" label.
  - User unchecks any they don't want, then taps "Add Selected."
- Inserts only checked, non-duplicate names via `POST /api/names`.

### 3. Matches

Shows all names where both Rob and Camille voted Yes, ranked by average Elo.

#### Default View: Ranked List
- Names listed in order of combined Elo score (highest first).
- Each row shows: rank number, name (bold, large), combined Elo score (subtle).
- Tapping a row expands to show meaning/origin/description.
- "Compare" button (floating or at top) enters tournament mode.
- Empty state: "No matches yet. Keep swiping!"

#### Tournament Mode
- Two name cards shown side by side (or stacked on mobile).
- Each card shows: name (large, bold). Meaning/origin/description shown below the name if they fit; otherwise tappable to expand.
- "Skip" button at bottom to get a new pair without voting.
- Tap a card to pick the winner. Brief animation (winner pulses / scales up, loser fades). Then next pair loads.
- Back/close button to return to the ranked list.
- No round counter or session limit — the user leaves whenever they want.
- Users cannot see their partner's individual Elo scores or rankings.

---

## Swipe Implementation Notes

Use a touch gesture library (e.g., `@use-gesture/react` + `react-spring` or `framer-motion`) for the Tinder-style card interaction:

- Card follows finger/cursor during drag.
- Rotation proportional to horizontal drag distance (slight tilt).
- Opacity of Yes/No indicators increases as the card moves.
- Release threshold: if card is dragged past ~40% of screen width, commit the vote. Otherwise, spring back.
- Card exits with momentum in the swipe direction.
- Background card is slightly visible behind the top card (stacked deck effect).

---

## Design Direction

**Aesthetic:** Clean, soft, warm. Bold typography. Not cutesy — more like a refined product with personality.

- **Palette:** Soft warm neutrals (cream, warm gray) with one bold accent color (e.g., a warm coral or terracotta). Muted sage or soft navy for secondary elements.
- **Typography:** One strong display font for names (large, bold, could be a serif or a distinctive sans-serif — something with character). Clean sans-serif for UI text. Names on cards should scale to fill the available width — a short name like "Max" appears much larger than "Alexander."
- **Cards:** Rounded corners, subtle shadow, generous padding. Cards should feel tactile.
- **Motion:** Smooth spring animations on swipe. Gentle transitions between screens. The "It's a match" moment should feel celebratory (confetti, glow, something fun but brief).
- **Dark mode:** System preference via `prefers-color-scheme`. Both themes should feel warm.
- **Mobile-first:** Designed for phone screens. Desktop should work but isn't the priority.

---

## Match Celebration

When a user votes Yes on a name and it creates a new match (the other user already voted Yes), show a brief celebration overlay:

- "It's a match! 🎉"
- The name displayed large and centered.
- Auto-dismisses after 2 seconds or on tap.
- Subtle confetti or particle effect.

---

## Network Error Handling

- On app load, check connectivity. If offline, show a full-screen "No internet connection" message with a retry button.
- On API failure, show inline error with retry. Don't lose the user's place in the swipe queue.

---

## Project Structure

```
junior/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── migrations.sql              # Run manually: turso db shell junior < migrations.sql
├── public/
│   └── icons/                  # PWA icons (icon-192x192.png, icon-512x512.png)
├── app/
│   ├── layout.tsx              # Root layout (fonts, meta, offline banner)
│   ├── manifest.ts             # PWA manifest (built-in Next.js support)
│   ├── page.tsx                # Redirects to /lists
│   ├── globals.css
│   ├── lists/
│   │   └── page.tsx            # My Lists (with New/Yes/No sub-tabs)
│   ├── add/
│   │   └── page.tsx            # Add screen (single + bulk AI)
│   ├── matches/
│   │   └── page.tsx            # Matches + Tournament mode
│   └── api/
│       ├── names/
│       │   ├── route.ts        # GET & POST /api/names
│       │   ├── [id]/
│       │   │   └── vote/
│       │   │       └── route.ts # PATCH /api/names/:id/vote
│       │   └── extract/
│       │       └── route.ts    # POST /api/names/extract
│       ├── matches/
│       │   └── route.ts        # GET /api/matches
│       └── tournament/
│           ├── pair/
│           │   └── route.ts    # GET /api/tournament/pair
│           └── result/
│               └── route.ts    # POST /api/tournament/result
├── components/
│   ├── SwipeCard.tsx
│   ├── NameCard.tsx
│   ├── TournamentView.tsx
│   ├── BulkAddReview.tsx
│   ├── MatchCelebration.tsx
│   ├── UserPicker.tsx          # First-visit identity selection
│   └── BottomNav.tsx
└── lib/
    ├── db.ts                   # Turso client setup
    ├── elo.ts                  # Elo calculation helpers
    └── api.ts                  # Client-side API fetch helpers
```

---

## Environment Variables

```
TURSO_DATABASE_URL=libsql://junior-<org>.turso.io
TURSO_AUTH_TOKEN=...
AI_GATEWAY_API_KEY=...
```

---

## Out of Scope (for now)

- Offline support / service worker caching
- Push notifications
- Authentication / passwords
- Name deletion
- Gender filtering (it's a boy)
- Sharing / inviting additional users
- Import from external baby name APIs
- Analytics
