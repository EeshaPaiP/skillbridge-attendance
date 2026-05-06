import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

const jsonHeaders = { 'content-type': 'application/json' };

const getAuthOrigin = (request: Request) => request.headers.get('origin') ?? 'http://localhost:3000';

const createUsersTableIfNeeded = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT NOT NULL,
      institution_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body.', details: error instanceof Error ? error.message : String(error) }),
      {
        status: 400,
        headers: jsonHeaders,
      },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim() : undefined;
  const password = typeof body.password === 'string' ? body.password : undefined;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const metadata =
    typeof body.metadata === 'object' && body.metadata !== null
      ? (body.metadata as Record<string, unknown>)
      : null;
  const role =
    typeof body.role === 'string'
      ? body.role
      : typeof metadata?.role === 'string'
      ? metadata.role
      : 'student';

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  let result;

  try {
    result = await auth.signUp.email({
      email,
      password,
      name: name || '',
      fetchOptions: {
        headers: {
          origin: getAuthOrigin(request),
        },
      },
    });
  } catch (error) {
    console.error('signup route exception', {
      error,
      requestBody: { email, name, role },
    });

    return new Response(
      JSON.stringify({
        error: 'Signup exception',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: jsonHeaders,
      },
    );
  }

  if (result?.error) {
    const errorPayload = typeof result.error === 'string' ? result.error : result.error?.message ?? JSON.stringify(result.error);
    return new Response(
      JSON.stringify({
        error: errorPayload,
        result: result,
      }),
      {
        status: 400,
        headers: jsonHeaders,
      },
    );
  }

  const userId = result.data?.user?.id;
  if (userId) {
    await createUsersTableIfNeeded();
    await sql`
      INSERT INTO users (clerk_user_id, name, role)
      VALUES (${userId}, ${name ?? null}, ${role})
      ON CONFLICT (clerk_user_id) DO NOTHING
    `;
  }

  return new Response(JSON.stringify({ data: result.data }), {
    status: 200,
    headers: jsonHeaders,
  });
}
