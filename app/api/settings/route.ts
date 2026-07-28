import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Provisioned lazily so existing per-couple databases pick the table up on
// deploy without a manual `turso db shell` migration (see migrations/002).
let ensured: Promise<unknown> | null = null;
function ensureSettingsTable() {
  ensured ??= db
    .execute(
      `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    )
    .catch((e) => {
      ensured = null;
      throw e;
    });
  return ensured;
}

export async function GET() {
  await ensureSettingsTable();
  const result = await db.execute({
    sql: `SELECT value FROM settings WHERE key = 'baby_last_name'`,
    args: [],
  });
  return NextResponse.json({
    babyLastName: (result.rows[0]?.value as string | undefined) ?? "",
  });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as { babyLastName?: unknown };

  if (
    typeof body.babyLastName !== "string" ||
    body.babyLastName.length > 100
  ) {
    return NextResponse.json({ error: "invalid babyLastName" }, { status: 400 });
  }

  const value = body.babyLastName.trim();
  await ensureSettingsTable();
  await db.execute({
    sql: `INSERT INTO settings (key, value) VALUES ('baby_last_name', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [value],
  });
  return NextResponse.json({ babyLastName: value });
}
