/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[Stripe Check Status] Unauthorized access attempt.');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.email;
    const userId = user.id;

    if (!email) {
      console.error('[Stripe Check Status Error] Logged in user has no email.');
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    console.log(`[Stripe Check Status] Checking status for user ${userId} (${email})`);
    
    // 1. Search for Stripe customers with this email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      console.log(`[Stripe Check Status] No Stripe customer found for email ${email}`);
      return NextResponse.json({ plan: 'free', status: 'none' });
    }

    const customerId = customers.data[0].id;
    console.log(`[Stripe Check Status] Found Stripe customer: ${customerId}`);

    // 2. Search for active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const activeSubscription = subscriptions.data[0];
      console.log(`[Stripe Check Status] Found active subscription: ${activeSubscription.id}`);

      // Update Supabase database automatically using admin service role (bypasses RLS safety checks)
      const adminSupabase = createAdminClient();
      const { error: dbError } = await adminSupabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: activeSubscription.id,
          current_period_end: new Date((activeSubscription as any).current_period_end * 1000)
        });

      if (dbError) {
        console.error('[Stripe Check Status Error] Failed to update subscription in database:', dbError.message);
        throw dbError;
      }

      console.log('[Stripe Check Status Success] Successfully restored/updated database subscription to pro.');
      return NextResponse.json({ plan: 'pro', status: 'active' });
    }

    console.log(`[Stripe Check Status] Customer has no active subscriptions.`);
    return NextResponse.json({ plan: 'free', status: 'none' });
  } catch (error: any) {
    console.error('[Stripe Check Status Error] Exception:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
