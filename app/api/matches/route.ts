import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const result = await db.execute({
    sql: `SELECT id, name, meaning, origin, description, added_at,
                 rob_vote, camille_vote, rob_elo, camille_elo
          FROM names
          WHERE rob_vote = 'yes' AND camille_vote = 'yes'
          ORDER BY (rob_elo + camille_elo) / 2.0 DESC, name ASC`,
    args: [],
  });
  return NextResponse.json({ names: result.rows });
}
