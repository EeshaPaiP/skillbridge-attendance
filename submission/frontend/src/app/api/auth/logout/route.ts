import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const getAuthOrigin = (request: Request) => {
  const authBaseUrl = process.env.NEON_AUTH_BASE_URL || process.env.BETTER_AUTH_BASE_URL;

  if (authBaseUrl) {
    return new URL(authBaseUrl).origin;
  }

  return request.headers.get('origin') ?? 'http://localhost:3000';
};

export async function POST(request: Request) {
  let signOutError: unknown = null;

  try {
    const result = await auth.signOut({
      fetchOptions: {
        headers: {
          origin: getAuthOrigin(request),
        },
      },
    });

    if (result.error) {
      signOutError = result.error;
    }
  } catch (error) {
    signOutError = error;
  }

  if (signOutError) {
    console.error('logout route signOut warning', {
      error: signOutError instanceof Error ? signOutError.message : String(signOutError),
    });
  }

  const response = NextResponse.redirect(new URL('/sign-in', request.url), { status: 303 });
  response.cookies.delete('__Secure-neon-auth.session_token');
  response.cookies.delete('__Secure-neon-auth.local.session_data');
  response.cookies.delete('__Secure-neon-auth.session_challange');

  return response;
}
