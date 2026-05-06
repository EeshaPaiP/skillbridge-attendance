import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getDbUser, hasRole } from "@/lib/api-auth";

export async function POST(request: Request) {
  const dbUser = await getDbUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!hasRole(dbUser, ["trainer"])) {
    return NextResponse.json({ error: "Only trainers can create sessions." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    batchId?: number | string;
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null;

  const batchId = Number(body?.batchId);
  const title = body?.title?.trim();
  const date = body?.date;
  const startTime = body?.startTime;
  const endTime = body?.endTime;

  if (!batchId || Number.isNaN(batchId) || !title || !date || !startTime || !endTime) {
    return NextResponse.json(
      { error: "batchId, title, date, startTime, and endTime are required." },
      { status: 400 },
    );
  }

  const [assignedBatch] = await sql`
    SELECT 1
    FROM batch_trainers
    WHERE batch_id = ${batchId} AND trainer_id = ${dbUser.id}
    LIMIT 1
  `;

  if (!assignedBatch) {
    return NextResponse.json({ error: "You can only create sessions for your assigned batches." }, { status: 403 });
  }

  const [session] = await sql`
    INSERT INTO sessions (batch_id, trainer_id, title, date, start_time, end_time)
    VALUES (${batchId}, ${dbUser.id}, ${title}, ${date}, ${startTime}, ${endTime})
    RETURNING id, batch_id, trainer_id, title, date, start_time, end_time
  `;

  revalidatePath("/dashboard");
  return NextResponse.json({ session }, { status: 201 });
}
