import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface AttendanceRow {
  student_id: number;
  student_name: string;
  status: string | null;
  marked_at: string | Date | null;
}

export default async function SessionAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.getSession();

  if (!session?.data?.user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const sessionId = Number(id);

  if (!sessionId || Number.isNaN(sessionId)) {
    redirect("/dashboard");
  }

  const [dbUser] = await sql`
    SELECT id, role FROM users WHERE clerk_user_id = ${session.data.user.id}
  `;

  if (!dbUser || dbUser.role?.toLowerCase() !== "trainer") {
    redirect("/dashboard");
  }

  const [sessionRecord] = await sql`
    SELECT s.id, s.title, s.date, s.start_time, s.end_time, s.trainer_id, b.name AS batch_name
    FROM sessions s
    JOIN batches b ON b.id = s.batch_id
    WHERE s.id = ${sessionId}
    LIMIT 1
  `;

  if (!sessionRecord || sessionRecord.trainer_id !== dbUser.id) {
    redirect("/dashboard");
  }

  const attendanceRows = (await sql`
    SELECT
      u.id AS student_id,
      u.name AS student_name,
      a.status,
      a.marked_at
    FROM sessions s
    JOIN batch_students bs ON bs.batch_id = s.batch_id
    JOIN users u ON u.id = bs.student_id
    LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = u.id
    WHERE s.id = ${sessionId}
    ORDER BY u.name
  `) as AttendanceRow[];

  const markedCount = attendanceRows.filter((row) => row.status).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <Link href="/dashboard" className="cursor-pointer text-sm font-bold text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300 mb-3">
              Session Attendance
            </p>
            <h1 className="text-4xl font-black tracking-tight">{sessionRecord.title}</h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              {sessionRecord.batch_name} · {new Date(sessionRecord.date).toLocaleDateString()} ·{" "}
              {sessionRecord.start_time} - {sessionRecord.end_time}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Enrolled</p>
            <p className="text-3xl font-black mt-2">{attendanceRows.length}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Marked</p>
            <p className="text-3xl font-black mt-2">{markedCount}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pending</p>
            <p className="text-3xl font-black mt-2">{attendanceRows.length - markedCount}</p>
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Students</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Marked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {attendanceRows.map((row) => (
                  <tr key={row.student_id}>
                    <td className="px-6 py-4 font-semibold">{row.student_name}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900"}`}>
                        {row.status ?? "not marked"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {row.marked_at ? new Date(row.marked_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {attendanceRows.length === 0 && (
            <p className="text-sm text-zinc-500 italic text-center py-8">No students are enrolled in this batch yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
