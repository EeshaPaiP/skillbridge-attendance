import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const jsonHeaders = { 'content-type': 'application/json' };
const getAuthOrigin = (request: Request) => request.headers.get('origin') ?? 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const result = await auth.signOut({
      fetchOptions: {
        headers: {
          origin: getAuthOrigin(request),
        },
      },
    });

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error.message || JSON.stringify(result.error) }),
        {
          status: 400,
          headers: jsonHeaders,
        },
      );
    }

    return NextResponse.redirect(new URL('/sign-in', request.url));
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: jsonHeaders,
      },
    );
  }
}
