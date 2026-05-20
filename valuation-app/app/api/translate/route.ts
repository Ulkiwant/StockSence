import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  try {
    const { texts } = await req.json() as { texts: string[] };
    if (!Array.isArray(texts) || texts.length === 0) return Response.json({ translations: [] });

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Traduis ces titres d'actualités financières en français. Retourne uniquement un tableau JSON de strings, dans le même ordre, sans commentaire.\n\n${JSON.stringify(texts)}`,
      }],
    });

    const content = msg.content[0];
    if (content.type === "text") {
      const match = content.text.match(/\[[\s\S]*\]/);
      if (match) return Response.json({ translations: JSON.parse(match[0]) });
    }
    return Response.json({ translations: texts });
  } catch {
    return Response.json({ translations: [] }, { status: 500 });
  }
}
