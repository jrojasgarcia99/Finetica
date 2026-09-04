import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { assembleAssistantPayload, buildSystemPrompt } from "@/lib/assistant/context";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Modelo económico de OpenAI. Cambiá `OPENAI_ASSISTANT_MODEL` para probar otro
 *  (p. ej. gpt-4.1-nano). El proveedor se cambia editando solo esta línea
 *  gracias al Vercel AI SDK. */
const MODEL = process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini";
const DAILY_LIMIT = Number(process.env.OPENAI_ASSISTANT_DAILY_LIMIT || 50);
const MAX_MESSAGES = 24;
const MAX_CHARS = 4000;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("NO_API_KEY", { status: 503 });
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("BAD_REQUEST", { status: 400 });
  }
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) return new Response("BAD_REQUEST", { status: 400 });

  const { supabase, spaceId, locale, instrucciones, resumen } =
    await assembleAssistantPayload();

  // Límite diario por cuenta (incremento atómico en la base).
  const { data: count, error } = await supabase.rpc("assistant_bump_usage", {
    p_space_id: spaceId,
    p_limit: DAILY_LIMIT,
  });
  if (error) {
    console.error("assistant_bump_usage failed:", error.message);
  } else if (typeof count === "number" && count > DAILY_LIMIT) {
    return new Response("RATE_LIMIT", { status: 429 });
  }

  // Se recorta el historial y el largo de cada mensaje para acotar el costo.
  const messages: UIMessage[] = incoming.slice(-MAX_MESSAGES).map((msg) => ({
    ...msg,
    parts: (msg.parts ?? []).map((part) =>
      part.type === "text"
        ? { ...part, text: String(part.text).slice(0, MAX_CHARS) }
        : part,
    ),
  }));

  const result = streamText({
    model: openai(MODEL),
    system: buildSystemPrompt(locale, resumen, instrucciones),
    messages: await convertToModelMessages(messages),
    temperature: 0.4,
    maxOutputTokens: 700,
  });

  return result.toUIMessageStreamResponse();
}
