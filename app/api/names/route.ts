import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Filter } from "@/lib/api";
import { isUser, partnerOf, VOTE_COL } from "@/lib/user";

function isFilter(v: string | null): v is Filter {
  return v === "new" || v === "yes" || v === "no" || v === "reconsider";
}

function parseCursor(raw: string | null): { added_at: string; id: number } | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf("|");
  if (idx <= 0) return null;
  const added_at = raw.slice(0, idx);
  const id = Number(raw.slice(idx + 1));
  if (!Number.isInteger(id) || id <= 0) return null;
  return { added_at, id };
}

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get("user");
  const filter = request.nextUrl.searchParams.get("filter");

  if (!isUser(user) || !isFilter(filter)) {
    return NextResponse.json({ error: "invalid user or filter" }, { status: 400 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const cursor = parseCursor(request.nextUrl.searchParams.get("cursor"));
  const rawLimit = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 50));

  const column = VOTE_COL[user];
  const clauses: string[] = [];
  const args: (string | number)[] = [];

  if (filter === "reconsider") {
    const myCol = VOTE_COL[user];
    const partnerCol = VOTE_COL[partnerOf(user)];
    clauses.push(`${myCol} = ? AND ${partnerCol} = ?`);
    args.push("no", "yes");
  } else {
    clauses.push(filter === "new" ? `${column} IS NULL` : `${column} = ?`);
    if (filter !== "new") args.push(filter);

    // search and cursor only apply to yes/no lists
    if (filter !== "new" && q.length > 0) {
      clauses.push(`LOWER(name) LIKE LOWER(?)`);
      args.push(`%${q}%`);
    }
    if (filter !== "new" && cursor) {
      // ORDER BY added_at DESC, id DESC — next page comes after the cursor pair
      clauses.push(`(added_at < ? OR (added_at = ? AND id < ?))`);
      args.push(cursor.added_at, cursor.added_at, cursor.id);
    }
  }

  args.push(limit);

  const result = await db.execute({
    sql: `SELECT id, name, meaning, origin, description, added_at,
                 user1_vote, user2_vote, user1_elo, user2_elo
          FROM names
          WHERE ${clauses.join(" AND ")}
          ORDER BY added_at DESC, id DESC
          LIMIT ?`,
    args,
  });

  const rows = result.rows as unknown as {
    id: number;
    added_at: string;
  }[];
  const nextCursor =
    filter === "yes" || filter === "no"
      ? rows.length === limit
        ? `${rows[rows.length - 1].added_at}|${rows[rows.length - 1].id}`
        : null
      : null;

  return NextResponse.json({ names: result.rows, nextCursor });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    names?: { name: string; meaning?: string; origin?: string; description?: string }[];
  };

  if (!body.names || !Array.isArray(body.names) || body.names.length === 0) {
    return NextResponse.json({ error: "names array required" }, { status: 400 });
  }

  let inserted = 0;
  for (const item of body.names) {
    const name = item.name?.trim();
    if (!name) continue;
    const result = await db.execute({
      sql: `INSERT OR IGNORE INTO names (name, meaning, origin, description)
            VALUES (?, ?, ?, ?)`,
      args: [name, item.meaning ?? null, item.origin ?? null, item.description ?? null],
    });
    if (result.rowsAffected > 0) inserted += 1;
  }

  return NextResponse.json({ inserted });
}
