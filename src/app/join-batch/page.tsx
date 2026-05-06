import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JoinBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth.getSession();
  const { id } = await searchParams;
  const batchId = Number(id);

  if (!batchId || Number.isNaN(batchId)) {
    redirect("/dashboard");
  }

  if (!session || !session.data) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/join-batch?id=${batchId}`)}`);
  }

  const user = session.data.user;

  const [userRecord] = await sql`
    SELECT id, role FROM users WHERE clerk_user_id = ${user.id}
  `;

  if (!userRecord) {
    redirect(`/sign-up?callbackUrl=${encodeURIComponent(`/join-batch?id=${batchId}`)}`);
  }

  if (userRecord.role?.toLowerCase() === "student") {
    await sql`
      INSERT INTO batch_students (batch_id, student_id)
      VALUES (${batchId}, ${userRecord.id})
      ON CONFLICT DO NOTHING
    `;
  }

  redirect("/dashboard");
}
