import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.167.0/encoding/base64.ts";

console.log("submit-client function started");

Deno.serve(async (req): Promise<Response> => {
  const origin = req.headers.get("origin") || "*";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
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

  // Get the session or user object
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data: requestData } = await supabase.auth.getUser(token);
  const userId = requestData.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Handle actual POST request
  const { content, imageData, baseUrl } = await req.json();

  const result = getBaseUrlAndPath(baseUrl);
  if (!result) {
    return new Response("Invalid base URL", { status: 400 });
  }
  const { domain, route } = result;

  // Fetch the page document
  let { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id")
    .eq("domain", domain)
    .eq("route", route)
    .single();

  if (pageError) {
    console.error(`Error fetching page for URL: ${baseUrl}`, pageError.message);
    return new Response("Internal Server Error: failed to fetch page", {
      status: 500,
    });
  }

  if (!page) {
    console.error(`Page not found for URL: ${baseUrl}`);
    return new Response("Internal Server Error: page not found for URL", {
      status: 500,
    });
  }
  const pageId = page.id;

  let uploadedUrl = null;

  if (imageData) {
    const matches = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) return new Response("Invalid image format", { status: 400 });

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = decode(base64Data);

    const filename = `${Date.now()}-${crypto.randomUUID()}.png`;
    const path = `comments-images/${pageId}/${userId}-${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("comments-images")
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError.message);
      return new Response("Image upload failed", { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("comments-images")
      .getPublicUrl(path);

    uploadedUrl = urlData?.publicUrl;
  }

  // Rate limiting check last X seconds
  const { data: recentComments } = await supabase
    .from("comments")
    .select("id")
    .eq("author", userId)
    .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString());

  if (recentComments && recentComments.length >= 5) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
    });
  }

  //  Insert the comment into the database
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .insert([
      {
        content,
        page_id: pageId,
        image_url: uploadedUrl,
      },
    ])
    .select()
    .single();

  if (commentError) {
    console.error("Error adding comment:", commentError.message);
    return new Response("Internal Server Error: error adding comment", {
      status: 500,
    });
  }

  const data = {
    message: "Comment added successfully",
    comment,
    pageId,
    imageData,
    commentId: comment.id,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  });
});

function getBaseUrlAndPath(
  url: string,
): { baseUrl: string; domain: string; route: string } | null {
  try {
    const parsedUrl = new URL(url);
    const baseUrl: string = parsedUrl.origin; // Get origin (scheme + hostname + port)
    const domain: string = parsedUrl.hostname; // Get hostname (domain name)
    const route: string = parsedUrl.pathname.endsWith("/")
      ? parsedUrl.pathname.slice(0, -1) // Remove trailing slash
      : parsedUrl.pathname; // Get pathname without trailing slash

    return { baseUrl, domain, route };
  } catch (error) {
    console.error("Invalid URL:", error);
    console.error(url);

    return null;
  }
}
