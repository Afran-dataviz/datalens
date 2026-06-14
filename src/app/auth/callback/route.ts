import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const plan = searchParams.get('plan');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const redirectUrl = plan 
        ? `${origin}${next}?plan=${plan}` 
        : `${origin}${next}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Return the user to login page with an error parameter
  return NextResponse.redirect(`${origin}/login?error=Could not exchange auth code for session`);
}
