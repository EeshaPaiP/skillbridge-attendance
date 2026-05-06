import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getDbUser, hasRole } from "@/lib/api-auth";

export async function GET() {
  const dbUser = await getDbUser();

  if (!dbUser) {
    return new NextResponse("Authentication required.", { status: 401 });
  }

  if (!hasRole(dbUser, ["manager", "officer"])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await sql`
      WITH student_sessions AS (
        SELECT s.id AS session_id, s.batch_id, bs.student_id
        FROM sessions s
        JOIN batch_students bs ON bs.batch_id = s.batch_id
      ),
      attendance_agg AS (
        SELECT ss.batch_id, COUNT(*) AS total_possible,
        COUNT(a.*) FILTER (WHERE a.status = 'present') AS present_count
        FROM student_sessions ss
        LEFT JOIN attendance a ON a.session_id = ss.session_id AND a.student_id = ss.student_id
        GROUP BY ss.batch_id
      )
      SELECT inst.name AS institution_name, COUNT(DISTINCT b.id) AS total_batches,
      ROUND(COALESCE(SUM(attendance_agg.present_count)::numeric / NULLIF(SUM(attendance_agg.total_possible), 0) * 100, 0), 2) AS avg_attendance_pct
      FROM users inst
      LEFT JOIN batches b ON b.institution_id = inst.id
      LEFT JOIN attendance_agg ON attendance_agg.batch_id = b.id
      WHERE inst.role = 'institution'
      GROUP BY inst.id, inst.name
      ORDER BY inst.name;
    `;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Summary error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
