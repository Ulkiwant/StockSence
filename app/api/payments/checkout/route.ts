import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { stripe, VALID_PRICE_IDS } from "@/lib/stripe-server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://finazen.fr";

export async function POST(req: NextRequest) {
  // Auth requise
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return Response.json({ error: "Connexion requise" }, { status: 401 });

  const { priceId } = await req.json() as { priceId: string };
  if (!priceId || !VALID_PRICE_IDS.has(priceId as never)) {
    return Response.json({ error: "Prix invalide" }, { status: 400 });
  }

  // Récupérer ou créer le customer Stripe lié à cet email
  let customerId: string | undefined;
  const { data: planRow } = await supabase
    .from("user_plans")
    .select("stripe_customer_id")
    .eq("email", user.email)
    .single();

  if (planRow?.stripe_customer_id) {
    customerId = planRow.stripe_customer_id;
  } else {
    // Chercher si un customer Stripe existe déjà pour cet email
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }
  }

  // Créer la session Stripe Checkout
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/tarifs?cancelled=true`,
      metadata: { user_email: user.email },
      locale: "fr",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        metadata: { user_email: user.email },
      },
    });
    return Response.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
