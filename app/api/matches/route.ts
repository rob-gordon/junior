import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const result = await db.execute({
    sql: `SELECT id, name, meaning, origin, description, added_at,
                 user1_vote, user2_vote, user1_elo, user2_elo
          FROM names
          WHERE user1_vote = 'yes' AND user2_vote = 'yes'
          ORDER BY (user1_elo + user2_elo) / 2.0 DESC, name ASC`,
    args: [],
  });
  return NextResponse.json({ names: result.rows });
}
