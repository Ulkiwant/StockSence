import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient as createServerClient } from "@/lib/supabase-server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { AlertEmail, alertSubject } from "@/emails/AlertEmail";
import { render as renderAsync } from "@react-email/render";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://stocksense.app";

// ─── Sécurité : comparaison à temps constant (résistante aux timing attacks) ──
function authorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // Si le secret n'est pas configuré, bloquer toutes les requêtes
  if (!cronSecret) return false;
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (provided.length !== cronSecret.length) return false;
  // crypto.timingSafeEqual évite les timing attacks sur la comparaison de secrets
  const a = Buffer.from(provided);
  const b = Buffer.from(cronSecret);
  try {
    return require("crypto").timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createServerClient();

  // 1. Récupérer toutes les alertes actives avec l'email de l'utilisateur
  const { data: alerts, error: alertsError } = await supabase
    .from("alerts")
    .select("id, user_id, ticker, alert_type, threshold")
    .eq("active", true);

  if (alertsError) {
    console.error("[alerts/check] fetch alerts:", alertsError.message);
    return NextResponse.json({ error: alertsError.message }, { status: 500 });
  }
  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  // 2. Récupérer les emails des utilisateurs concernés
  const userIds = [...new Set(alerts.map((a) => a.user_id))];
  const { data: profiles } = await supabase
    .from("auth.users")
    .select("id, email")
    .in("id", userIds);

  const emailByUserId = Object.fromEntries(
    (profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email])
  );

  let sent = 0;
  const tickers = [...new Set(alerts.map((a: { ticker: string }) => a.ticker))];

  // 3. Pour chaque ticker unique, appeler notre propre API d'analyse
  const dataByTicker: Record<string, { signal: string; price: number; name: string }> = {};
  await Promise.all(
    tickers.map(async (ticker: string) => {
      try {
        const [stockRes, analyzeRes] = await Promise.all([
          fetch(`${APP_URL}/api/stock/${ticker}`),
          fetch(`${APP_URL}/api/stock/${ticker}/analyze`),
        ]);
        if (!stockRes.ok) return;
        const stock   = await stockRes.json();
        const analyze = analyzeRes.ok ? await analyzeRes.json() : null;
        dataByTicker[ticker] = {
          signal: stock.valuation?.signal ?? "HOLD",
          price:  stock.currentPrice ?? 0,
          name:   stock.name ?? ticker,
        };
        void analyze; // analyze used for future enrichment
      } catch {
        console.warn(`[alerts/check] skip ${ticker}: fetch failed`);
      }
    })
  );

  // 4. Vérifier chaque alerte et envoyer si nécessaire
  for (const alert of alerts) {
    const stock = dataByTicker[alert.ticker];
    if (!stock) continue;

    const userEmail = emailByUserId[alert.user_id];
    if (!userEmail) continue;

    // ── Signal change ──
    if (alert.alert_type === "signal_change") {
      // On compare avec la dernière valeur loguée
      const { data: lastLog } = await supabase
        .from("alert_logs")
        .select("value")
        .eq("alert_id", alert.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const previousSignal = lastLog?.value ?? null;
      if (previousSignal && previousSignal !== stock.signal) {
        await sendAlert({
          userEmail, ticker: alert.ticker,
          companyName: stock.name,
          alertType: "signal_change",
          before: previousSignal,
          after: stock.signal,
        });
        await supabase.from("alert_logs").insert({ alert_id: alert.id, value: stock.signal });
        sent++;
      } else if (!previousSignal) {
        // Premier check : juste logguer le signal actuel
        await supabase.from("alert_logs").insert({ alert_id: alert.id, value: stock.signal });
      }
    }

    // ── Price variation ──
    if (alert.alert_type === "price_variation" && alert.threshold) {
      const { data: lastLog } = await supabase
        .from("alert_logs")
        .select("value")
        .eq("alert_id", alert.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const previousPrice = lastLog ? parseFloat(lastLog.value) : null;
      if (previousPrice && previousPrice > 0) {
        const variationPct = Math.abs((stock.price - previousPrice) / previousPrice) * 100;
        if (variationPct >= alert.threshold) {
          const sign = stock.price > previousPrice ? "+" : "-";
          await sendAlert({
            userEmail, ticker: alert.ticker,
            companyName: stock.name,
            alertType: "price_variation",
            before: `${previousPrice.toFixed(2)} $`,
            after: `${sign}${variationPct.toFixed(1)}% (${stock.price.toFixed(2)} $)`,
          });
          await supabase.from("alert_logs").insert({ alert_id: alert.id, value: String(stock.price) });
          sent++;
        }
      } else {
        await supabase.from("alert_logs").insert({ alert_id: alert.id, value: String(stock.price) });
      }
    }
  }

  return NextResponse.json({ checked: alerts.length, sent });
}

// ─── Helper : render + envoyer l'email ───────────────────────────────────────
async function sendAlert({
  userEmail, ticker, companyName, alertType, before, after,
}: {
  userEmail: string;
  ticker: string;
  companyName: string;
  alertType: "signal_change" | "price_variation";
  before: string;
  after: string;
}) {
  const stockUrl = `${APP_URL}/stock/${ticker}`;
  const unsubscribeUrl = `${APP_URL}/parametres/alertes`;

  const html = await renderAsync(
    AlertEmail({ tickerSymbol: ticker, companyName, alertType, before, after, stockUrl, unsubscribeUrl })
  );

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   userEmail,
    subject: alertSubject(ticker, alertType, after),
    html,
  });
}
