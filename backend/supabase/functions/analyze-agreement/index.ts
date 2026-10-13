import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const DISCLAIMER =
  "This analysis is for informational purposes only and is not legal advice. Consult a qualified professional in Hong Kong.";

const REVIEW_CATEGORIES = [
  "Deposit",
  "Early Termination",
  "Notice Period",
  "Repair Obligation",
  "Utility Charges",
  "Hidden Charges",
  "Renovation Responsibility",
  "Renewal Terms",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const agreementId = body.agreement_id as string | undefined;
    if (!agreementId) {
      return jsonResponse({ error: "agreement_id is required" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: agreement, error: agreementError } = await admin
      .from("agreements")
      .select("id, user_id, extracted_text, status")
      .eq("id", agreementId)
      .single();

    if (agreementError || !agreement) {
      return jsonResponse({ error: "Agreement not found" }, 404);
    }
    if (agreement.user_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    await admin
      .from("agreements")
      .update({ status: "processing" })
      .eq("id", agreementId);

    const text = (agreement.extracted_text ?? "").trim();
    if (!text) {
      await admin
        .from("agreements")
        .update({ status: "failed" })
        .eq("id", agreementId);
      return jsonResponse(
        {
          error:
            "No extracted text on agreement. Run OCR/upload pipeline first.",
        },
        422,
      );
    }

    let riskLevel: "Low" | "Medium" | "High" = "Medium";
    let summary =
      "Automated review placeholder — configure OPENAI_API_KEY for full analysis.";
    let findings: Record<string, unknown>[] = REVIEW_CATEGORIES.map((cat) => ({
      category: cat,
      note: "Pending AI analysis",
      severity: "Medium",
    }));

    if (openaiKey) {
      const prompt = `You are reviewing a Hong Kong residential tenancy agreement excerpt. Categories: ${REVIEW_CATEGORIES.join(", ")}. Return JSON with keys: risk_level (Low|Medium|High), executive_summary (string), findings (array of {category, issue, recommendation, severity}), recommendations (string[]), questions_to_ask (string[]). Do not give legal advice.\n\nAgreement text:\n${text.slice(0, 12000)}`;

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Friendly tone. Hong Kong rental context. Not legal advice.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        throw new Error(`OpenAI error: ${errText}`);
      }

      const aiJson = await aiRes.json();
      const content = aiJson.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        riskLevel = parsed.risk_level ?? riskLevel;
        summary = parsed.executive_summary ?? summary;
        findings = parsed.findings ?? findings;
      }
    }

    const { data: review, error: reviewError } = await admin
      .from("agreement_reviews")
      .insert({
        agreement_id: agreementId,
        risk_level: riskLevel,
        summary,
        findings_json: findings,
      })
      .select()
      .single();

    if (reviewError) throw reviewError;

    await admin
      .from("agreements")
      .update({ status: "reviewed" })
      .eq("id", agreementId);

    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Agreement analysis complete",
      body: summary.slice(0, 200),
      metadata: { agreement_id: agreementId, review_id: review.id },
    });

    return jsonResponse({
      review,
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
