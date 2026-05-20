import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Link,
} from "@react-email/components";

export interface AlertEmailProps {
  tickerSymbol: string;       // ex: "AAPL"
  companyName: string;        // ex: "Apple Inc."
  alertType: "signal_change" | "price_variation";
  before: string;             // ex: "HOLD" ou "212,40 $"
  after: string;              // ex: "STRONG BUY" ou "223,80 $"
  stockUrl: string;           // ex: "https://stocksense.app/stock/AAPL"
  unsubscribeUrl: string;     // ex: "https://stocksense.app/parametres/alertes?unsubscribe=..."
}

export function AlertEmail({
  tickerSymbol,
  companyName,
  alertType,
  before,
  after,
  stockUrl,
  unsubscribeUrl,
}: AlertEmailProps) {
  const isSignal = alertType === "signal_change";
  const alertLabel = isSignal ? "Signal IA mis à jour" : "Variation de prix";

  return (
    <Html lang="fr">
      <Head />
      <Body style={{ background: "#111110", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "32px 0" }}>

          {/* Header */}
          <Section style={{ background: "#1c1b1a", borderRadius: "16px 16px 0 0", padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <Heading style={{ color: "#fafaf9", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
              📈 StockSense
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ background: "#1c1b1a", padding: "28px 32px" }}>
            {/* Alert type badge */}
            <Text style={{
              display: "inline-block",
              background: "rgba(134,239,172,0.10)",
              border: "1px solid rgba(134,239,172,0.22)",
              color: "#86efac", fontSize: 11, fontWeight: 600,
              padding: "4px 10px", borderRadius: 20, margin: "0 0 16px",
            }}>
              🔔 {alertLabel}
            </Text>

            {/* Company */}
            <Heading style={{ color: "#fafaf9", fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.4px" }}>
              {tickerSymbol}
            </Heading>
            <Text style={{ color: "#a8a29e", fontSize: 13, margin: "0 0 24px" }}>
              {companyName}
            </Text>

            {/* Before → After */}
            <Section style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 20px", marginBottom: 24 }}>
              <Text style={{ color: "#78716c", fontSize: 11, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isSignal ? "Changement de signal" : "Évolution du cours"}
              </Text>
              <div>
                <Text style={{ color: "#a8a29e", fontSize: 16, fontWeight: 500, margin: 0, display: "inline" }}>
                  {before}
                </Text>
                <Text style={{ color: "#57534e", fontSize: 16, margin: "0 8px", display: "inline" }}>→</Text>
                <Text style={{ color: "#86efac", fontSize: 18, fontWeight: 800, margin: 0, display: "inline" }}>
                  {after}
                </Text>
              </div>
            </Section>

            {/* CTA */}
            <Button
              href={stockUrl}
              style={{
                display: "block", textAlign: "center",
                background: "rgba(134,239,172,0.13)",
                border: "1px solid rgba(134,239,172,0.32)",
                color: "#86efac",
                fontSize: 14, fontWeight: 700,
                padding: "13px 24px", borderRadius: 10,
                textDecoration: "none", marginBottom: 16,
              }}
            >
              Voir l&apos;analyse complète →
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ background: "#161615", borderRadius: "0 0 16px 16px", padding: "16px 32px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Text style={{ color: "#57534e", fontSize: 11, margin: "0 0 4px", lineHeight: 1.6 }}>
              Vous recevez cet email car vous avez activé des alertes sur StockSense.
            </Text>
            <Link href={unsubscribeUrl} style={{ color: "#78716c", fontSize: 11 }}>
              Gérer mes alertes · Se désinscrire
            </Link>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// Ligne d'objet de l'email — utilisée par la route API
export function alertSubject(ticker: string, alertType: "signal_change" | "price_variation", after: string): string {
  if (alertType === "signal_change") return `[StockSense] ${ticker} vient de passer en ${after}`;
  return `[StockSense] ${ticker} a varié de ${after}`;
}
