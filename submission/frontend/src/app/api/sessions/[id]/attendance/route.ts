import { sql } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.getSession();
  const user = session?.data?.user;

  if (!user) {
    return new NextResponse('Authentication required.', { status: 401 });
  }

  const [dbUser] = await sql`
    SELECT id, role FROM users WHERE clerk_user_id = ${user.id}
  `;

  if (!dbUser) {
    return new NextResponse('Local user profile not found.', { status: 404 });
  }

  const { id } = await params;
  const sessionId = Number(id);
  if (!sessionId || Number.isNaN(sessionId)) {
    return new NextResponse('Invalid session id.', { status: 400 });
  }

  const [sessionRecord] = await sql`
    SELECT id, trainer_id FROM sessions WHERE id = ${sessionId}
  `;

  if (!sessionRecord) {
    return new NextResponse('Session not found.', { status: 404 });
  }

  if (dbUser.role?.toLowerCase() !== 'trainer' || sessionRecord.trainer_id !== dbUser.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const attendanceRows = await sql`
    SELECT a.id, a.status, a.marked_at, u.name AS student_name
    FROM attendance a
    JOIN users u ON u.id = a.student_id
    WHERE a.session_id = ${sessionId}
    ORDER BY a.marked_at DESC
  `;

  return NextResponse.json(attendanceRows);
}
