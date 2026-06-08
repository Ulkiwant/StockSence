import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";

const MAX_TEXTS   = 15;   // nombre max de titres par requête
const MAX_CHARS   = 300;  // longueur max par titre

export async function POST(req: Request) {
  // Rate limit : 20 requêtes/minute par IP
  if (!checkRateLimit(getRateLimitKey(req), 20, 60)) {
    return Response.json({ translations: [] }, { status: 429 });
  }

  try {
    const { texts } = await req.json() as { texts: unknown };

    // Validation stricte des entrées
    if (!Array.isArray(texts) || texts.length === 0) {
      return Response.json({ translations: [] });
    }
    if (texts.length > MAX_TEXTS) {
      return Response.json({ error: `Maximum ${MAX_TEXTS} titres par requête` }, { status: 400 });
    }

    // Sanitisation : ne garder que des strings, tronquer les trop longues
    const sanitized = texts
      .filter((t): t is string => typeof t === "string")
      .map(t => t.slice(0, MAX_CHARS));

    if (sanitized.length === 0) return Response.json({ translations: [] });

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Traduis ces titres d'actualités financières en français. Retourne uniquement un tableau JSON de strings, dans le même ordre, sans commentaire.\n\n${JSON.stringify(sanitized)}`,
      }],
    });

    const content = msg.content[0];
    if (content.type === "text") {
      const match = content.text.match(/\[[\s\S]*\]/);
      if (match) return Response.json({ translations: JSON.parse(match[0]) });
    }
    return Response.json({ translations: sanitized });
  } catch {
    return Response.json({ translations: [] }, { status: 500 });
  }
}
