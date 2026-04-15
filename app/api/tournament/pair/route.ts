import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get("user");
  if (user !== "rob" && user !== "camille") {
    return NextResponse.json({ error: "invalid user" }, { status: 400 });
  }

  const excludeParam = request.nextUrl.searchParams.get("exclude");
  const excludeIds = excludeParam
    ? excludeParam
        .split(",")
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isFinite(n))
    : [];

  const baseCols = `id, name, meaning, origin, description, added_at,
                    rob_vote, camille_vote, rob_elo, camille_elo`;

  let result = await db.execute({
    sql: `SELECT ${baseCols} FROM names
          WHERE rob_vote = 'yes' AND camille_vote = 'yes'
          ${excludeIds.length ? `AND id NOT IN (${excludeIds.map(() => "?").join(",")})` : ""}
          ORDER BY RANDOM()
          LIMIT 2`,
    args: excludeIds,
  });

  // Fallback: if exclusion left fewer than 2 rows (e.g. N=2), ignore exclude.
  if (result.rows.length < 2) {
    result = await db.execute({
      sql: `SELECT ${baseCols} FROM names
            WHERE rob_vote = 'yes' AND camille_vote = 'yes'
            ORDER BY RANDOM()
            LIMIT 2`,
      args: [],
    });
  }

  if (result.rows.length < 2) {
    return NextResponse.json({ pair: null, reason: "not_enough" });
  }

  return NextResponse.json({ pair: [result.rows[0], result.rows[1]] });
}
