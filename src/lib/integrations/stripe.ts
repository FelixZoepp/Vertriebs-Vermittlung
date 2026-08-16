import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeInstance;
}

export async function createCustomer(
  email: string,
  firmenname: string
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();
  return stripe.customers.create({
    email,
    name: firmenname,
    metadata: { source: "vertriebs-vermittlung" },
  });
}

export async function createInvoice(
  customerId: string,
  amountCent: number,
  description: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient();

  // Create the invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: 14,
    auto_advance: true,
    metadata,
    payment_settings: {
      payment_method_types: ["sepa_debit"],
    },
  });

  // Add a single line item
  await stripe.invoiceItems.create({
    customer: customerId,
    invoice: invoice.id,
    amount: amountCent,
    currency: "eur",
    description,
  });

  return invoice;
}

export async function sendInvoice(
  invoiceId: string
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient();
  return stripe.invoices.finalizeInvoice(invoiceId);
}

export async function getInvoiceStatus(
  invoiceId: string
): Promise<Stripe.Invoice.Status | null> {
  const stripe = getStripeClient();
  const invoice = await stripe.invoices.retrieve(invoiceId);
  return invoice.status;
}
