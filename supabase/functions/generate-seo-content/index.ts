import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keyword, city, page_type, template_prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let prompt = template_prompt || "";
    if (!prompt) {
      if (page_type === "city") {
        prompt = `Write a 800-1200 word SEO article about chatting with ${keyword} in ${city || "India"}. Include sections about safety, features, and why SingleTape is the best platform. Make it engaging, human-like, and conversational. Include 3-5 FAQs at the end.`;
      } else if (page_type === "intent") {
        prompt = `Write a 800-1200 word SEO article about "${keyword}". Focus on how SingleTape helps users achieve this. Include benefits, features, safety tips, and a compelling call-to-action. Include 3-5 FAQs at the end.`;
      } else {
        prompt = `Write a 800-1200 word SEO article about "${keyword}"${city ? ` in ${city}` : ""}. Make it engaging and SEO-optimized for SingleTape, an anonymous chat platform in India. Include 3-5 FAQs.`;
      }
    } else {
      prompt = prompt.replace(/\{keyword\}/g, keyword || "").replace(/\{city\}/g, city || "");
    }

    const systemPrompt = `You are an SEO content writer for SingleTape, an anonymous chat platform in India. 
You must return a JSON object with these exact fields:
- title: SEO-optimized page title (under 60 chars)
- meta_description: compelling meta description (under 160 chars)  
- content_html: 800-1200 word article in HTML format with h2, h3, p tags. Use semantic HTML. Do NOT include h1.
- faqs: array of {question, answer} objects (3-5 FAQs)

Return ONLY valid JSON, no markdown code blocks.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_seo_content",
              description: "Return the generated SEO content",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "SEO page title under 60 chars" },
                  meta_description: { type: "string", description: "Meta description under 160 chars" },
                  content_html: { type: "string", description: "800-1200 word article in HTML with h2, h3, p tags" },
                  faqs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "meta_description", "content_html", "faqs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_seo_content" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", status, text);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-seo-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
