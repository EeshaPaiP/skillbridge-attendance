import { sql } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.getSession();
  const user = session?.data?.user;

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { id } = await params;
  const batchId = Number(id);
  if (!batchId || Number.isNaN(batchId)) {
    return NextResponse.json({ error: 'Invalid batch id.' }, { status: 400 });
  }

  const [dbUser] = await sql`
    SELECT id, role FROM users WHERE clerk_user_id = ${user.id}
  `;

  if (!dbUser) {
    return NextResponse.json({ error: 'Local user profile not found.' }, { status: 404 });
  }

  if (dbUser.role?.toLowerCase() !== 'student') {
    return NextResponse.json({ error: 'Only students can join batches.' }, { status: 403 });
  }

  await sql`
    INSERT INTO batch_students (batch_id, student_id)
    VALUES (${batchId}, ${dbUser.id})
    ON CONFLICT DO NOTHING
  `;

  return NextResponse.json({ success: true });
}
