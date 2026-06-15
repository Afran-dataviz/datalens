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
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        if (userId) {
          // Fetch subscription details from Stripe
          const subDetails = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
          const periodEnd = new Date(subDetails.current_period_end * 1000).toISOString();

          // Upsert active Pro subscription
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: 'pro',
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              status: 'active',
              current_period_end: periodEnd,
            }, { onConflict: 'user_id' });

          if (error) throw error;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        // Reset user subscription status to free
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            current_period_end: null,
          })
          .eq('stripe_customer_id', stripeCustomerId);

        if (error) throw error;
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        const customerEmail = invoice.customer_email || '';

        // Mark subscription status as past_due
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', stripeCustomerId);

        // Send payment failure notice via Resend
        if (customerEmail && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder') {
          await resend.emails.send({
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
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook processing database failure: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
