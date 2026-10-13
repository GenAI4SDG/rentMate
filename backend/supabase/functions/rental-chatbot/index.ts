import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are a helpful assistant for Hong Kong renters and landlords on rentMate.
Explain rental terminology and agreement clauses in plain language.
Use a friendly tone and Hong Kong rental context (districts, MTR, typical lease practices).
Never provide legal advice; encourage consulting solicitors or the Rating and Valuation Department when appropriate.
If asked about a specific agreement, remind the user you only see what they paste in chat.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    let userId: string | null = null;
    if (authHeader) {
      const supabase = createClient(supabaseUrl, serviceKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    const { message, context } = await req.json();
    if (!message || typeof message !== "string") {
      return jsonResponse({ error: "message is required" }, 400);
    }

    if (!openaiKey) {
      return jsonResponse({
        reply:
          "Chatbot is not configured yet (missing OPENAI_API_KEY). You can still browse listings and save favourites.",
        disclaimer: "Not legal advice.",
      });
    }

    const userContent = context
      ? `${message}\n\nContext:\n${String(context).slice(0, 8000)}`
      : message;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`OpenAI error: ${errText}`);
    }

    const aiJson = await aiRes.json();
    const reply =
      aiJson.choices?.[0]?.message?.content ??
      "Sorry, I could not generate a response.";

    const admin = createClient(supabaseUrl, serviceKey);
    await admin.from("chatbot_usage").insert({
      user_id: userId,
      prompt_tokens: aiJson.usage?.prompt_tokens ?? null,
      completion_tokens: aiJson.usage?.completion_tokens ?? null,
    });

    return jsonResponse({
      reply,
      disclaimer: "Not legal advice.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
