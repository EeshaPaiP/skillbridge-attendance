import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDbUser, hasRole } from "@/lib/api-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!hasRole(dbUser, ["trainer", "institution"])) {
    return NextResponse.json({ error: "Only trainers or institutions can generate invite links." }, { status: 403 });
  }

  const { id } = await params;
  const batchId = Number(id);

  if (!batchId || Number.isNaN(batchId)) {
    return NextResponse.json({ error: "Invalid batch id." }, { status: 400 });
  }

  const [batch] = await sql`
    SELECT b.id, b.name, b.institution_id
    FROM batches b
    LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
    WHERE b.id = ${batchId}
      AND (
        b.institution_id = ${dbUser.id}
        OR bt.trainer_id = ${dbUser.id}
      )
    LIMIT 1
  `;

  if (!batch) {
    return NextResponse.json({ error: "Batch not found or not assigned to you." }, { status: 404 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const inviteUrl = `${origin}/join-batch?id=${batchId}`;

  return NextResponse.json({
    batchId,
    batchName: batch.name,
    inviteUrl,
  });
}
