import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Generate recovery link
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const redirectTo = `${origin}/auth/callback?next=/dashboard/settings`;

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo
      }
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    const actionLink = linkData.properties.action_link;

    // 2. Send email using Resend API directly
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    const { error: mailError } = await resend.emails.send({
      from: 'DataLens <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your DataLens password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #080A0F; color: #F5F0E8; border: 1px solid #1E2130; border-radius: 16px;">
          <h2 style="color: #C9A84C; font-family: Georgia, serif; font-size: 24px; margin-bottom: 20px;">Reset your DataLens password</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #F5F0E8; font-weight: 300;">We received a request to reset the password for your DataLens account. Click the button below to sign in and set a new password:</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="${actionLink}" style="background: linear-gradient(135deg, #C9A84C, #E8C97A); color: #080A0F; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 15px rgba(201, 168, 76, 0.25);">Reset Password</a>
          </div>
          <p style="color: #6B7280; font-size: 12px; font-weight: 300; margin-top: 30px;">If you did not request a password reset, you can safely ignore this email.</p>
          <p style="color: #6B7280; font-size: 12px; font-weight: 300;">If the button above does not work, please copy and paste the following URL into your web browser:</p>
          <p style="color: #8B6FBB; font-size: 12px; word-break: break-all; font-weight: 300;">${actionLink}</p>
          <hr style="border: none; border-top: 1px solid #1E2130; margin: 40px 0 20px 0;" />
          <p style="color: #6B7280; font-size: 11px; font-weight: 300; text-align: center;">DataLens Inc. &bull; Enterprise Business Intelligence Solutions</p>
        </div>
      `
    });

    if (mailError) {
      return NextResponse.json({ error: `Failed to dispatch email: ${mailError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
