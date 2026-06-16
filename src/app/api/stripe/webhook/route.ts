/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[Stripe Webhook Error] STRIPE_SECRET_KEY is not configured in environment variables!");
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Stripe Webhook Error] STRIPE_WEBHOOK_SECRET is not configured in environment variables!");
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error("[Stripe Webhook Error] Missing stripe-signature header.");
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[Stripe Webhook] Event verified successfully. Type: ${event.type}`);
  } catch (err: any) {
    console.error(`[Stripe Webhook Error] Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('[Stripe Webhook] Processing checkout.session.completed event...');
        const session = event.data.object as any;
        console.log('[Stripe Webhook] Extracted Stripe checkout session object successfully.');
        
        const userId = session.metadata?.user_id;
        console.log('[Stripe Webhook] Extracted user_id from session metadata:', userId);
        
        console.log('[Stripe Webhook] Executing Supabase upsert on subscriptions table...');
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: 'pro',
            status: 'active',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });

        if (error) {
          console.error('[Stripe Webhook Database Error] Failed to upsert subscription in database:', error.message, error);
          throw error;
        }
        
        console.log('[Stripe Webhook Success] Successfully updated subscription to pro for user:', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        console.log('[Stripe Webhook] Processing customer.subscription.deleted for customer:', stripeCustomerId);

        // Reset user subscription status to free
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            current_period_end: null,
          })
          .eq('stripe_customer_id', stripeCustomerId);

        if (error) {
          console.error('[Stripe Webhook Database Error] Failed to update free plan status:', error.message);
          throw error;
        }
        
        console.log('[Stripe Webhook Success] Successfully reset plan to free for customer:', stripeCustomerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        const customerEmail = invoice.customer_email || '';
        console.log('[Stripe Webhook] Processing invoice.payment_failed for customer:', stripeCustomerId, 'Email:', customerEmail);

        // Mark subscription status as past_due
        const { error: dbError } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', stripeCustomerId);

        if (dbError) {
          console.error('[Stripe Webhook Database Error] Failed to update past_due status:', dbError.message);
        }

        // Send payment failure notice via Resend
        if (customerEmail && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder') {
          console.log('[Stripe Webhook] Sending payment failure email to:', customerEmail);
          const { error: mailError } = await resend.emails.send({
            from: 'billing@datalens.com',
            to: customerEmail,
            subject: 'Action Required: Your DataLens subscription payment failed',
            html: `
              <h2>Payment Failed</h2>
              <p>We were unable to process your recent monthly subscription payment for DataLens Pro.</p>
              <p>Your subscription is currently marked as past due. To prevent service interruptions, please log in and update your credit card details.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings">Manage Billing Details</a></p>
            `,
          });
          if (mailError) {
            console.error('[Stripe Webhook Email Error] Failed to send payment failure email:', mailError.message);
          } else {
            console.log('[Stripe Webhook Success] Payment failure email sent successfully.');
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook Global Error] Webhook processing database failure: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
