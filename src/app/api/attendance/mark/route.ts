import { sql } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth.getSession();
  const user = session?.data?.user;

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json();
  const sessionId = Number(body.sessionId);

  if (!sessionId || Number.isNaN(sessionId)) {
    return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
  }

  const [dbUser] = await sql`
    SELECT id, role FROM users WHERE clerk_user_id = ${user.id}
  `;

  if (!dbUser) {
    return NextResponse.json({ error: 'Local user profile not found.' }, { status: 404 });
  }

  if (dbUser.role?.toLowerCase() !== 'student') {
    return NextResponse.json({ error: 'Only students can mark attendance.' }, { status: 403 });
  }

  const [sessionRecord] = await sql`
    SELECT id, batch_id FROM sessions WHERE id = ${sessionId}
  `;

  if (!sessionRecord) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  const [batchStudent] = await sql`
    SELECT 1 FROM batch_students
    WHERE batch_id = ${sessionRecord.batch_id}
      AND student_id = ${dbUser.id}
  `;

  if (!batchStudent) {
    return NextResponse.json({ error: 'You are not enrolled in this batch.' }, { status: 403 });
  }

  await sql`
    INSERT INTO attendance (session_id, student_id, status)
    VALUES (${sessionId}, ${dbUser.id}, 'present')
    ON CONFLICT (session_id, student_id) DO UPDATE
      SET status = 'present', marked_at = NOW()
  `;

  return NextResponse.json({ success: true });
}
