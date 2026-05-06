import { auth } from '@/lib/auth';

const jsonHeaders = { 'content-type': 'application/json' };

const getAuthOrigin = (request: Request) => request.headers.get('origin') ?? 'http://localhost:3000';

export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email?.toString()?.trim();
  const password = body.password?.toString();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  let result;

  try {
    result = await auth.signIn.email({
      email,
      password,
      fetchOptions: {
        headers: {
          origin: getAuthOrigin(request),
        },
      },
    });
  } catch (error) {
    console.error('login route exception', { error, requestBody: { email } });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  if (result.error) {
    return new Response(
      JSON.stringify({
        error: result.error.message || JSON.stringify(result.error),
      }),
      {
        status: 400,
        headers: jsonHeaders,
      },
    );
  }

  return new Response(JSON.stringify({ data: result.data }), {
    status: 200,
    headers: jsonHeaders,
  });
}
