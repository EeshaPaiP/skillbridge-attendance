import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDbUser, hasRole } from "@/lib/api-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!hasRole(dbUser, ["institution", "manager", "officer"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const institutionId = Number(id);

  if (!institutionId || Number.isNaN(institutionId)) {
    return NextResponse.json({ error: "Invalid institution id." }, { status: 400 });
  }

  if (dbUser.role.toLowerCase() === "institution" && dbUser.id !== institutionId) {
    return NextResponse.json({ error: "Institutions can only view their own summary." }, { status: 403 });
  }

  const [institution] = await sql`
    SELECT id, name
    FROM users
    WHERE id = ${institutionId} AND role = 'institution'
    LIMIT 1
  `;

  if (!institution) {
    return NextResponse.json({ error: "Institution not found." }, { status: 404 });
  }

  const batches = await sql`
    WITH student_sessions AS (
      SELECT b.id AS batch_id, s.id AS session_id, bs.student_id
      FROM batches b
      LEFT JOIN sessions s ON s.batch_id = b.id
      LEFT JOIN batch_students bs ON bs.batch_id = b.id
      WHERE b.institution_id = ${institutionId}
    )
    SELECT
      b.id,
      b.name,
      COUNT(DISTINCT bs.student_id) AS total_students,
      COUNT(DISTINCT s.id) AS total_sessions,
      COUNT(a.id) FILTER (WHERE a.status = 'present') AS present_marks,
      ROUND(
        COALESCE(
          COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric
          / NULLIF(COUNT(DISTINCT bs.student_id) * COUNT(DISTINCT s.id), 0)
          * 100,
          0
        ),
        2
      ) AS attendance_pct
    FROM batches b
    LEFT JOIN batch_students bs ON bs.batch_id = b.id
    LEFT JOIN sessions s ON s.batch_id = b.id
    LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = bs.student_id
    WHERE b.institution_id = ${institutionId}
    GROUP BY b.id, b.name
    ORDER BY b.name
  `;

  const [totals] = await sql`
    SELECT
      COUNT(DISTINCT b.id) AS total_batches,
      COUNT(DISTINCT bt.trainer_id) AS total_trainers,
      COUNT(DISTINCT bs.student_id) AS total_students,
      COUNT(DISTINCT s.id) AS total_sessions,
      ROUND(
        COALESCE(
          COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric
          / NULLIF(COUNT(DISTINCT bs.student_id) * COUNT(DISTINCT s.id), 0)
          * 100,
          0
        ),
        2
      ) AS attendance_pct
    FROM batches b
    LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
    LEFT JOIN batch_students bs ON bs.batch_id = b.id
    LEFT JOIN sessions s ON s.batch_id = b.id
    LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = bs.student_id
    WHERE b.institution_id = ${institutionId}
  `;

  return NextResponse.json({
    institution,
    totals,
    batches,
  });
}
