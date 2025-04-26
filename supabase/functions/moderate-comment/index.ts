import { createClient } from "jsr:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import axios from "npm:axios"; // important: use `npm:` here for Deno compatibility

console.log("moderate-comment function started");

Deno.serve(async (req) => {
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const origin = req.headers.get("origin") || "*";

  const supabase = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-client-info, apikey",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const payload = await req.json();
  console.log("Webhook triggered for comment:", payload.record.id);

  const { id, content, image_url } = payload.record;

  const moderationPayload = {
    model: "omni-moderation-latest",
    input: [
      { type: "text", text: content },
      ...(image_url
        ? [{ type: "image_url", image_url: { url: image_url } }]
        : []),
    ],
  };

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/moderations",
      moderationPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
      },
    );

    const result = response.data.results[0];
    console.log("Moderation result:", result);

    const updateData: any = {
      moderation_status: result.flagged ? "flagged" : "pass",
    };

    if (result.flagged) {
      // Filter only the categories that are flagged true
      const flaggedScores: Record<string, number> = {};

      for (const [category, isFlagged] of Object.entries(result.categories)) {
        if (isFlagged) {
          flaggedScores[category] = result.category_scores[category];
        }
      }

      updateData.moderation_scores = flaggedScores;
      updateData.moderated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("comments")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating comment moderation status:", error);
      return new Response("Error updating comment", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      "Error during moderation:",
      (err as any)?.response?.data || (err as any)?.message,
    );
    return new Response("Moderation error", { status: 500 });
  }
});
