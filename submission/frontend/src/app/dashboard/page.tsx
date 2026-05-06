import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import CreateSessionForm from "@/components/CreateSessionForm";
import CreateBatchForm from "@/components/CreateBatchForm";
import InviteButton from "@/components/InviteButton";
import MarkAttendanceButton from "@/components/MarkAttendanceButton";

export const dynamic = "force-dynamic";

interface AuthUser {
  sub?: string;
  id: string;
  email?: string;
  name: string;
  role?: string;
}

interface BasicUserRow {
  id: number;
  name: string | null;
}

interface BatchRow {
  id: number;
  name: string;
}

interface StudentSessionRow {
  id: number;
  title: string;
  date: string | Date;
  start_time: string;
  end_time: string;
  batch_name: string;
  trainer_name: string;
  is_marked: boolean;
}

interface TrainerSessionRow {
  id: number;
  title: string;
  date: string | Date;
  start_time: string;
  end_time: string;
  batch_name: string;
  marked_count: number | string;
  enrolled_count: number | string;
}

interface InstitutionBatchRow {
  id: number;
  name: string;
  trainer_name: string;
  student_count: number | string;
  session_count: number | string;
}

interface BatchStudentRow {
  student_name: string;
  batch_name: string;
}

interface OverviewStatsRow {
  total_institutions: number | string;
  total_trainers: number | string;
  total_students: number | string;
  total_batches: number | string;
  total_sessions: number | string;
  total_attendance_marks: number | string;
}

interface InstitutionOverviewRow {
  id: number;
  name: string;
  batch_count: number | string;
  trainer_count: number | string;
  student_count: number | string;
  session_count: number | string;
}

interface RecentAttendanceRow {
  marked_at: string | Date;
  student_name: string;
  session_title: string;
  batch_name: string;
}

interface RecentSessionRow {
  title: string;
  date: string | Date;
  start_time: string;
  batch_name: string;
  trainer_name: string;
}

const roleTitles: Record<string, string> = {
  student: "Student",
  trainer: "Trainer",
  institution: "Institution",
  manager: "Programme Manager",
  officer: "Monitoring Officer",
};

export default async function DashboardPage() {
  const session = await auth.getSession();

  if (!session || !session.data) {
    redirect("/sign-in");
  }

  const user = session.data.user as AuthUser;
  const userId = user.id ?? user.sub;

  const [userRecord] = userId
    ? await sql`SELECT id, role FROM users WHERE clerk_user_id = ${userId}`
    : [];

  if (!userRecord) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans text-zinc-900 dark:text-zinc-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-10 shadow-sm">
            <h1 className="text-3xl font-bold mb-4">Profile not found</h1>
            <p className="text-zinc-600 dark:text-zinc-300 mb-6">User record missing in local database.</p>
            <a href="/sign-in" className="cursor-pointer rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">Return to Sign In</a>
          </div>
        </div>
      </div>
    );
  }

  const role = (userRecord.role || "student").toLowerCase();
  const fullName = user.name || "User";
  const prettyRole = roleTitles[role] ?? "Student";

  let trainerBatches: BatchRow[] = [];
  let trainerSessions: TrainerSessionRow[] = [];
  let institutionTrainers: BasicUserRow[] = [];
  let institutionBatches: InstitutionBatchRow[] = [];
  let batchStudentsList: BatchStudentRow[] = [];
  let studentSessions: StudentSessionRow[] = [];
  let overviewStats: OverviewStatsRow | null = null;
  let allInstitutions: InstitutionOverviewRow[] = [];
  let recentAttendance: RecentAttendanceRow[] = [];
  let recentSessions: RecentSessionRow[] = [];

  if (role === "student") {
    studentSessions = (await sql`
      SELECT
        s.*,
        b.name AS batch_name,
        u.name AS trainer_name,
        EXISTS (
          SELECT 1
          FROM attendance a
          WHERE a.session_id = s.id AND a.student_id = ${userRecord.id}
        ) AS is_marked
      FROM sessions s
      JOIN batch_students bs ON bs.batch_id = s.batch_id
      JOIN batches b ON b.id = s.batch_id
      JOIN users u ON u.id = s.trainer_id
      WHERE bs.student_id = ${userRecord.id}
      ORDER BY s.date DESC, s.start_time DESC
    `) as StudentSessionRow[];
  }

  if (role === "trainer") {
    trainerBatches = (await sql`
      SELECT b.id, b.name FROM batches b
      JOIN batch_trainers bt ON bt.batch_id = b.id
      WHERE bt.trainer_id = ${userRecord.id}
    `) as BatchRow[];
    trainerSessions = (await sql`
      SELECT
        s.*,
        b.name AS batch_name,
        COUNT(a.id) AS marked_count,
        COUNT(bs.student_id) AS enrolled_count
      FROM sessions s
      JOIN batches b ON b.id = s.batch_id
      LEFT JOIN batch_students bs ON bs.batch_id = s.batch_id
      LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = bs.student_id
      WHERE s.trainer_id = ${userRecord.id}
      GROUP BY s.id, b.name
      ORDER BY s.date DESC, s.start_time DESC
      LIMIT 8
    `) as TrainerSessionRow[];
  }

  if (role === "institution") {
    institutionTrainers = (await sql`SELECT id, name FROM users WHERE role = 'trainer'`) as BasicUserRow[];
    institutionBatches = (await sql`
      SELECT
        b.id,
        b.name,
        COALESCE(MAX(t.name), 'Unassigned') AS trainer_name,
        COUNT(DISTINCT bs.student_id) AS student_count,
        COUNT(DISTINCT s.id) AS session_count
      FROM batches b
      LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
      LEFT JOIN users t ON t.id = bt.trainer_id
      LEFT JOIN batch_students bs ON bs.batch_id = b.id
      LEFT JOIN sessions s ON s.batch_id = b.id
      WHERE b.institution_id = ${userRecord.id}
      GROUP BY b.id, b.name
      ORDER BY b.id DESC
    `) as InstitutionBatchRow[];
    batchStudentsList = (await sql`
      SELECT u.name as student_name, b.name as batch_name
      FROM users u
      JOIN batch_students bs ON bs.student_id = u.id
      JOIN batches b ON b.id = bs.batch_id
      WHERE b.institution_id = ${userRecord.id}
      ORDER BY b.name, u.name
    `) as BatchStudentRow[];
  }

  if (role === "manager" || role === "officer") {
    [overviewStats] = (await sql`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'institution') as total_institutions,
        (SELECT COUNT(*) FROM users WHERE role = 'trainer') as total_trainers,
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM batches) as total_batches,
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM attendance) as total_attendance_marks
    `) as OverviewStatsRow[];
    allInstitutions = (await sql`
      SELECT
        inst.id,
        inst.name,
        COUNT(DISTINCT b.id) AS batch_count,
        COUNT(DISTINCT bt.trainer_id) AS trainer_count,
        COUNT(DISTINCT bs.student_id) AS student_count,
        COUNT(DISTINCT s.id) AS session_count
      FROM users inst
      LEFT JOIN batches b ON b.institution_id = inst.id
      LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
      LEFT JOIN batch_students bs ON bs.batch_id = b.id
      LEFT JOIN sessions s ON s.batch_id = b.id
      WHERE inst.role = 'institution'
      GROUP BY inst.id, inst.name
      ORDER BY inst.name
      LIMIT 10
    `) as InstitutionOverviewRow[];
    recentAttendance = (await sql`
      SELECT a.marked_at, u.name as student_name, s.title as session_title, b.name as batch_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN sessions s ON a.session_id = s.id
      JOIN batches b ON b.id = s.batch_id
      ORDER BY a.marked_at DESC LIMIT 5
    `) as RecentAttendanceRow[];
    recentSessions = (await sql`
      SELECT s.title, s.date, s.start_time, b.name AS batch_name, u.name AS trainer_name
      FROM sessions s
      JOIN batches b ON b.id = s.batch_id
      JOIN users u ON u.id = s.trainer_id
      ORDER BY s.date DESC, s.start_time DESC
      LIMIT 5
    `) as RecentSessionRow[];
  }

  // Get current date for UI restrictions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300 mb-3">SkillBridge Dashboard</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Welcome back, {fullName}.</h1>
            <p className="text-zinc-600 dark:text-zinc-300 font-medium">You are signed in as a <span className="text-blue-600 dark:text-blue-400">{prettyRole}</span></p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button className="cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-3 text-sm font-bold shadow-sm transition hover:scale-105 active:scale-95">Sign Out</button>
          </form>
        </header>

        <div className="grid gap-8 md:grid-cols-[1.5fr_0.9fr]">
          <main className="space-y-8">
            
            {/* INSTITUTION VIEW */}
            {role === "institution" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Batches</p>
                    <p className="text-3xl font-black mt-2">{institutionBatches.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Students</p>
                    <p className="text-3xl font-black mt-2">{batchStudentsList.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Trainers</p>
                    <p className="text-3xl font-black mt-2">{institutionTrainers.length}</p>
                  </div>
                </div>

                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-blue-600">Batch Management</h3>
                  <CreateBatchForm trainers={institutionTrainers} />
                </div>

                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Institution Batches</h3>
                  <div className="space-y-3">
                    {institutionBatches.map((batch) => (
                      <div key={batch.id} className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold">{batch.name}</p>
                            <p className="text-xs text-zinc-500 mt-1">Trainer: {batch.trainer_name}</p>
                          </div>
                          <div className="flex gap-3 text-xs font-bold text-zinc-500">
                            <span>{batch.student_count} students</span>
                            <span>{batch.session_count} sessions</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {institutionBatches.length === 0 && (
                      <p className="text-sm text-zinc-500 italic text-center py-8">No batches created yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Enrolled Students</h3>
                  <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-900">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
                        <tr><th className="px-6 py-4">Student</th><th className="px-6 py-4">Batch</th></tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                        {batchStudentsList.map((s, i) => (
                          <tr key={i}><td className="px-6 py-4 font-semibold">{s.student_name}</td><td className="px-6 py-4 text-blue-600 font-medium">{s.batch_name}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {batchStudentsList.length === 0 && (
                    <p className="text-sm text-zinc-500 italic text-center py-8">No students have joined your batches yet.</p>
                  )}
                </div>
              </>
            )}

            {/* TRAINER VIEW */}
            {role === "trainer" && (
              <div className="space-y-8">
                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-blue-600">Invite Students</h3>
                  <div className="space-y-3">
                    {trainerBatches.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <span className="font-bold">{b.name}</span>
                        <InviteButton batchName={b.name} batchId={String(b.id)} />
                      </div>
                    ))}
                    {trainerBatches.length === 0 && (
                      <p className="text-sm text-zinc-500 italic text-center py-8">No batches assigned yet.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Create Session</h3>
                  <CreateSessionForm batches={trainerBatches} />
                </div>
                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Recent Sessions</h3>
                  <div className="space-y-4">
                    {trainerSessions.map((s) => (
                      <div key={s.id} className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="font-bold">{s.title}</h4>
                            <p className="text-xs font-bold uppercase text-blue-600 mt-1">{s.batch_name}</p>
                            <p className="text-sm text-zinc-500 mt-2">{new Date(s.date).toLocaleDateString()} · {s.start_time} - {s.end_time}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                              {s.marked_count}/{s.enrolled_count} marked
                            </span>
                            <Link
                              href={`/dashboard/sessions/${s.id}`}
                              className="cursor-pointer text-xs font-bold text-blue-600 hover:underline"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    {trainerSessions.length === 0 && (
                      <p className="text-sm text-zinc-500 italic text-center py-8">No sessions created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STUDENT VIEW */}
            {role === "student" && (
              <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Available Sessions</h3>
                {studentSessions.length > 0 ? (
                  studentSessions.map(s => {
                    const sessionDate = new Date(s.date);
                    sessionDate.setHours(0,0,0,0);
                    // Restriction: Future sessions cannot mark attendance
                    const isFuture = sessionDate > today;

                    return (
                      <div key={s.id} className="p-6 mb-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 transition hover:border-blue-300">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg">{s.title}</h4>
                            <p className="text-[10px] font-black uppercase text-blue-600 tracking-tighter">{s.batch_name}</p>
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Trainer: {s.trainer_name}</p>
                          </div>
                          {isFuture ? (
                             <span className="text-xs font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-4 py-2 rounded-xl">Upcoming Session</span>
                          ) : (
                             <MarkAttendanceButton sessionId={String(s.id)} isAlreadyMarked={s.is_marked} />
                          )}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          <p><strong>Date:</strong> {new Date(s.date).toLocaleDateString()}</p>
                          <p><strong>Time:</strong> {s.start_time} - {s.end_time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-zinc-500 italic text-center py-10">No sessions available. Ensure you are assigned to a batch.</p>
                )}
              </div>
            )}

            {/* PROGRAMME MANAGER & MONITORING OFFICER VIEW */}
            {(role === "manager" || role === "officer") && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Institutions</p>
                    <p className="text-3xl font-black mt-2">{overviewStats?.total_institutions || 0}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Batches</p>
                    <p className="text-3xl font-black mt-2">{overviewStats?.total_batches || 0}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Students</p>
                    <p className="text-3xl font-black mt-2">{overviewStats?.total_students || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Trainers</p>
                    <p className="text-3xl font-black mt-2">{overviewStats?.total_trainers || 0}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sessions</p>
                    <p className="text-3xl font-black mt-2">{overviewStats?.total_sessions || 0}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Attendance</p>
                    <p className="text-3xl font-black mt-2">{overviewStats?.total_attendance_marks || 0}</p>
                  </div>
                </div>

                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Managed Institutions</h3>
                  <div className="space-y-4">
                    {allInstitutions.map((inst) => (
                      <div key={inst.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold">{inst.name}</p>
                          <p className="text-xs text-zinc-500">{inst.batch_count} batches · {inst.trainer_count} trainers · {inst.student_count} students</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600">{inst.session_count} sessions</span>
                      </div>
                    ))}
                    {allInstitutions.length === 0 && (
                      <p className="text-sm text-zinc-500 italic text-center py-8">No institutions found.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Recent Sessions</h3>
                  <div className="space-y-4">
                    {recentSessions.map((s, i) => (
                      <div key={i} className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5">
                        <p className="font-bold">{s.title}</p>
                        <p className="text-xs font-bold uppercase text-blue-600 mt-1">{s.batch_name}</p>
                        <p className="text-sm text-zinc-500 mt-2">Trainer: {s.trainer_name}</p>
                        <p className="text-sm text-zinc-500">{new Date(s.date).toLocaleDateString()} · {s.start_time}</p>
                      </div>
                    ))}
                    {recentSessions.length === 0 && (
                      <p className="text-sm text-zinc-500 italic text-center py-8">No sessions created yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>

          <aside className="space-y-6">
            <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-6">System Status</h3>
              <div className="space-y-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Database</span>
                  <span className="flex items-center gap-2 font-bold text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected</span>
                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY FOR MANAGERS/OFFICERS */}
            {(role === "manager" || role === "officer") && (
              <div className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Live Attendance</h3>
                <div className="space-y-4">
                  {recentAttendance.map((att, i) => (
                    <div key={i} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">{att.student_name}</p>
                      <p className="text-zinc-500">{att.session_title}</p>
                      <p className="text-zinc-500">{att.batch_name}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{new Date(att.marked_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                  {recentAttendance.length === 0 && <p className="text-xs italic text-zinc-500">No recent activity.</p>}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
