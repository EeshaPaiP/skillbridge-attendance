import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getDbUser, hasRole } from "@/lib/api-auth";

export async function POST(request: Request) {
  const dbUser = await getDbUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!hasRole(dbUser, ["institution", "trainer"])) {
    return NextResponse.json({ error: "Only institutions or trainers can create batches." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    trainerId?: number | string;
  } | null;

  const name = body?.name?.trim();
  const trainerId = Number(body?.trainerId ?? (dbUser.role.toLowerCase() === "trainer" ? dbUser.id : 0));

  if (!name) {
    return NextResponse.json({ error: "Batch name is required." }, { status: 400 });
  }

  if (dbUser.role.toLowerCase() === "institution" && (!trainerId || Number.isNaN(trainerId))) {
    return NextResponse.json({ error: "trainerId is required for institution-created batches." }, { status: 400 });
  }

  const institutionId = dbUser.role.toLowerCase() === "institution" ? dbUser.id : dbUser.institution_id;

  if (!institutionId) {
    return NextResponse.json({ error: "Trainer is not assigned to an institution." }, { status: 400 });
  }

  const [batch] = await sql`
    INSERT INTO batches (name, institution_id)
    VALUES (${name}, ${institutionId})
    RETURNING id, name, institution_id
  `;

  if (trainerId && !Number.isNaN(trainerId)) {
    await sql`
      INSERT INTO batch_trainers (batch_id, trainer_id)
      VALUES (${batch.id}, ${trainerId})
      ON CONFLICT DO NOTHING
    `;
  }

  revalidatePath("/dashboard");
  return NextResponse.json({ batch }, { status: 201 });
}
