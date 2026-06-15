/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId." },
        { status: 400 }
      );
    }

    // Query subscriptions using admin service role (bypasses RLS safety check)
    const supabase = createAdminClient();
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription billing profile found. Please upgrade to Pro first." },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to open Stripe billing customer portal." },
      { status: 500 }
    );
  }
}
