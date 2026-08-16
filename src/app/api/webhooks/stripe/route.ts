import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/integrations/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(
      "Webhook signature verification failed:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from("invoices")
          .update({
            status: "bezahlt",
            bezahlt_am: new Date().toISOString(),
          })
          .eq("stripe_invoice_id", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from("invoices")
          .update({ status: "fehlgeschlagen" })
          .eq("stripe_invoice_id", invoice.id);
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from("invoices")
          .update({ status: "versendet" })
          .eq("stripe_invoice_id", invoice.id);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error("Error processing webhook event:", err);
    // Return 200 to prevent Stripe retries on non-critical errors
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
