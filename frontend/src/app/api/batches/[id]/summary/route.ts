import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDbUser, hasRole } from "@/lib/api-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!hasRole(dbUser, ["institution", "trainer", "manager", "officer"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const batchId = Number(id);

  if (!batchId || Number.isNaN(batchId)) {
    return NextResponse.json({ error: "Invalid batch id." }, { status: 400 });
  }

  const [access] = await sql`
    SELECT b.id
    FROM batches b
    LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
    WHERE b.id = ${batchId}
      AND (
        ${dbUser.role.toLowerCase()} IN ('manager', 'officer')
        OR b.institution_id = ${dbUser.id}
        OR bt.trainer_id = ${dbUser.id}
      )
    LIMIT 1
  `;

  if (!access) {
    return NextResponse.json({ error: "Batch not found or forbidden." }, { status: 404 });
  }

  const [summary] = await sql`
    WITH enrolled AS (
      SELECT student_id
      FROM batch_students
      WHERE batch_id = ${batchId}
    ),
    batch_sessions AS (
      SELECT id
      FROM sessions
      WHERE batch_id = ${batchId}
    )
    SELECT
      b.id,
      b.name,
      COUNT(DISTINCT e.student_id) AS total_students,
      COUNT(DISTINCT bs.id) AS total_sessions,
      COUNT(a.id) FILTER (WHERE a.status = 'present') AS present_marks,
      COUNT(a.id) FILTER (WHERE a.status = 'late') AS late_marks,
      COUNT(a.id) FILTER (WHERE a.status = 'absent') AS absent_marks,
      COUNT(DISTINCT e.student_id) * COUNT(DISTINCT bs.id) AS total_possible_marks,
      ROUND(
        COALESCE(
          COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric
          / NULLIF(COUNT(DISTINCT e.student_id) * COUNT(DISTINCT bs.id), 0)
          * 100,
          0
        ),
        2
      ) AS attendance_pct
    FROM batches b
    LEFT JOIN enrolled e ON TRUE
    LEFT JOIN batch_sessions bs ON TRUE
    LEFT JOIN attendance a ON a.session_id = bs.id AND a.student_id = e.student_id
    WHERE b.id = ${batchId}
    GROUP BY b.id, b.name
  `;

  return NextResponse.json(summary);
}
