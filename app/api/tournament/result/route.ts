import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateElo } from "@/lib/elo";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    user?: string;
    winnerId?: number;
    loserId?: number;
  };

  const { user, winnerId, loserId } = body;

  if (user !== "rob" && user !== "camille") {
    return NextResponse.json({ error: "invalid user" }, { status: 400 });
  }
  if (
    !Number.isInteger(winnerId) ||
    !Number.isInteger(loserId) ||
    winnerId === loserId
  ) {
    return NextResponse.json(
      { error: "invalid winnerId / loserId" },
      { status: 400 },
    );
  }

  const column = user === "rob" ? "rob_elo" : "camille_elo";

  const result = await db.execute({
    sql: `SELECT id, ${column} AS elo FROM names WHERE id IN (?, ?)`,
    args: [winnerId!, loserId!],
  });

  if (result.rows.length !== 2) {
    return NextResponse.json(
      { error: "winner or loser not found" },
      { status: 404 },
    );
  }

  const winnerRow = result.rows.find((r) => (r.id as number) === winnerId);
  const loserRow = result.rows.find((r) => (r.id as number) === loserId);
  if (!winnerRow || !loserRow) {
    return NextResponse.json(
      { error: "winner or loser not found" },
      { status: 404 },
    );
  }

  const { winner, loser } = updateElo(
    winnerRow.elo as number,
    loserRow.elo as number,
  );

  await db.execute({
    sql: `UPDATE names SET ${column} = ? WHERE id = ?`,
    args: [winner, winnerId!],
  });
  await db.execute({
    sql: `UPDATE names SET ${column} = ? WHERE id = ?`,
    args: [loser, loserId!],
  });

  return NextResponse.json({ ok: true, winner, loser });
}
