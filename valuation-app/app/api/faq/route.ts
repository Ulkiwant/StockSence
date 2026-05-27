import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) return Response.json({ error: "Question vide" }, { status: 400 });

  const prompt = `Tu es l'assistant de Rendly, une application de valorisation boursière. Réponds en français, de façon concise (3-5 phrases max), sans jargon excessif. Si la question ne concerne pas la finance ou l'investissement, explique poliment que tu es spécialisé dans ce domaine.

Question : ${question}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return Response.json({ answer: text });
  } catch {
    return Response.json({ error: "Erreur IA" }, { status: 500 });
  }
}
