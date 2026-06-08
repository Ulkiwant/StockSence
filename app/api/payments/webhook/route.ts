import { NextRequest } from "next/server";
import { stripe, PRICE_TO_PLAN } from "@/lib/stripe-server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

/** Anonymise un email pour les logs (ex: qu***@em-lyon.com) — conformité RGPD */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

// Client Supabase avec service role (pas d'auth user ici)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature invalide:", err);
    return Response.json({ error: "Signature invalide" }, { status: 400 });
  }

  console.log(`Webhook reçu: ${event.type}`);

  switch (event.type) {

    /* ── Paiement réussi → activer le plan ── */
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email   = session.metadata?.user_email ?? session.customer_details?.email;
      if (!email) break;

      // Récupérer le subscription pour avoir le price_id
      let priceId: string | undefined;
      let subscriptionId: string | undefined;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        priceId        = sub.items.data[0]?.price?.id;
        subscriptionId = sub.id;
      }

      const plan = priceId ? (PRICE_TO_PLAN[priceId] ?? "free") : "free";
      const customerId = typeof session.customer === "string" ? session.customer : undefined;

      await supabaseAdmin.from("user_plans").upsert({
        email:                  email.toLowerCase(),
        plan,
        stripe_customer_id:     customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id:        priceId,
        granted_at:             new Date().toISOString(),
        expires_at:             null,
        note:                   "Abonnement Stripe",
      }, { onConflict: "email" });

      console.log(`✅ Plan ${plan} activé pour ${maskEmail(email)}`);
      break;
    }

    /* ── Abonnement mis à jour ── */
    case "customer.subscription.updated": {
      const sub   = event.data.object as Stripe.Subscription;
      const email = sub.metadata?.user_email;
      if (!email) break;

      const priceId = sub.items.data[0]?.price?.id;
      const plan    = priceId ? (PRICE_TO_PLAN[priceId] ?? "free") : "free";
      const status  = sub.status; // active, past_due, canceled...

      if (status === "active" || status === "trialing") {
        await supabaseAdmin.from("user_plans").upsert({
          email: email.toLowerCase(), plan,
          stripe_subscription_id: sub.id,
          stripe_price_id:        priceId,
          granted_at:             new Date().toISOString(),
          expires_at:             null,
        }, { onConflict: "email" });
      } else if (status === "canceled" || status === "unpaid") {
        // Rétrograder au plan gratuit
        await supabaseAdmin.from("user_plans").upsert({
          email: email.toLowerCase(), plan: "free",
          stripe_subscription_id: sub.id,
          granted_at:             new Date().toISOString(),
          expires_at:             null,
        }, { onConflict: "email" });
      }
      break;
    }

    /* ── Abonnement annulé → retour au gratuit ── */
    case "customer.subscription.deleted": {
      const sub   = event.data.object as Stripe.Subscription;
      const email = sub.metadata?.user_email;
      if (!email) break;

      await supabaseAdmin.from("user_plans").upsert({
        email: email.toLowerCase(), plan: "free",
        stripe_subscription_id: sub.id,
        granted_at:             new Date().toISOString(),
        expires_at:             null,
        note:                   "Abonnement annulé",
      }, { onConflict: "email" });

      console.log(`⚠️ Abonnement annulé pour ${maskEmail(email)} → plan free`);
      break;
    }
  }

  return Response.json({ received: true });
}
