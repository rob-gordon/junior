import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Filter = "new" | "yes" | "no";
type User = "rob" | "camille";

function isUser(v: string | null): v is User {
  return v === "rob" || v === "camille";
}
function isFilter(v: string | null): v is Filter {
  return v === "new" || v === "yes" || v === "no";
}

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get("user");
  const filter = request.nextUrl.searchParams.get("filter");

  if (!isUser(user) || !isFilter(filter)) {
    return NextResponse.json({ error: "invalid user or filter" }, { status: 400 });
  }

  const column = user === "rob" ? "rob_vote" : "camille_vote";
  const where = filter === "new" ? `${column} IS NULL` : `${column} = ?`;
  const args = filter === "new" ? [] : [filter];

  const result = await db.execute({
    sql: `SELECT id, name, meaning, origin, description, added_at,
                 rob_vote, camille_vote, rob_elo, camille_elo
          FROM names
          WHERE ${where}
          ORDER BY added_at DESC`,
    args,
  });

  return NextResponse.json({ names: result.rows });
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
