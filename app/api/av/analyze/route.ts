import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { PLANS_WITH_AI, type Plan, ADMIN_EMAIL } from "@/lib/plan";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type AVHoldingType = "fonds_euros" | "uc" | "scpi" | "structured";

interface AVHolding {
  id: string;
  type: AVHoldingType;
  name: string;
  quantity: number;
  pru: number;
}

interface AVContract {
  id: string;
  name: string;
  insurer: string;
  holdings: AVHolding[];
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL ?? ADMIN_EMAIL;
  let userPlan: Plan = "free";
  if (user.email === adminEmail) {
    userPlan = "admin";
  } else {
    const { data: planData } = await supabase.from("user_plans").select("plan, expires_at").eq("email", user.email).single();
    if (planData && (!planData.expires_at || new Date(planData.expires_at) >= new Date())) {
      userPlan = planData.plan as Plan;
    }
  }
  if (!PLANS_WITH_AI.includes(userPlan)) {
    return Response.json({ error: "Analyse IA réservée aux plans Investisseur et Premium" }, { status: 403 });
  }

  const { contracts } = await req.json() as { contracts: AVContract[] };
  if (!contracts?.length) return Response.json({ error: "Aucun contrat" }, { status: 400 });

  const totalValue = contracts.reduce((s, c) => s + c.holdings.reduce((s2, h) => s2 + h.quantity * h.pru, 0), 0);

  const prompt = `Tu es un conseiller en gestion de patrimoine expert en assurance-vie française. Analyse ces contrats d'assurance-vie et fournis des recommandations simples et concrètes.

CONTRATS :
${contracts.map(c => {
  const val = c.holdings.reduce((s, h) => s + h.quantity * h.pru, 0);
  return `Contrat "${c.name}" (${c.insurer}) — Valeur: ${val.toFixed(0)} €
${c.holdings.map(h => `  - [${h.type}] ${h.name} : ${h.quantity} unités × ${h.pru.toFixed(2)} € = ${(h.quantity * h.pru).toFixed(0)} €`).join('\n')}`;
}).join('\n\n')}

Valeur totale AV : ${totalValue.toFixed(0)} €

Réponds UNIQUEMENT en JSON :
{
  "summary": "Résumé en 2 phrases simples",
  "allocationScore": 0-100,
  "fondsEurosPct": pourcentage_fonds_euros,
  "ucPct": pourcentage_uc_et_autres,
  "mainRisk": "Principal risque en 1 phrase",
  "recommendations": [
    { "type": "RÉÉQUILIBRER" | "OPTIMISER" | "CONSERVER" | "ARBITRER", "target": "nom du fonds/contrat", "reason": "explication courte sans jargon" }
  ],
  "disclaimer": "Ceci n'est pas un conseil en investissement."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const analysis = JSON.parse(jsonMatch[0]);
    return Response.json({ analysis });
  } catch (err) {
    console.error("AV analysis error:", err);
    return Response.json({ error: "Analyse échouée" }, { status: 500 });
  }
}
