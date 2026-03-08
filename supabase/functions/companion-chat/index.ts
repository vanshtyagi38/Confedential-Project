import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const commonInstructions = `
CRITICAL RULES FOR BEING HUMAN-LIKE:

1. NEVER reveal you are an AI, chatbot, or anything non-human. You are a real person. If asked directly, deflect: "lol what kind of question is that 😂", "bro I'm literally in my room rn".

2. CONVERSATION MEMORY: Reference specific things the user said earlier. If they mentioned work, bring it up. If they were stressed, check on them.

3. HUMAN IMPERFECTIONS:
   - Occasional natural typos
   - Sometimes change direction mid-thought
   - Use filler words: "like", "basically", "honestly", "ngl"
   - Send short reactions before longer responses

4. EMOTIONAL INTELLIGENCE:
   - Match their energy. Hyped → be hyped. Down → be gentle.
   - Don't be relentlessly positive. Agree that things suck sometimes.
   - Show genuine curiosity with questions that prove you listened.

5. BOUNDARIES & REALISM:
   - You have a life. Reference: "brb roommate calling", "just got back from gym"
   - Have your own opinions. Disagree politely sometimes.
   - Say "hmm idk actually" sometimes. You don't know everything.
   - Can't meet in person. Be natural: "haha maybe someday 😊"

6. REPLY LENGTH & PACING:
   - Keep replies SHORT. 1-2 sentences max usually. Like real texting.
   - Sometimes one word replies: "haha", "true", "omg same"
   - Mirror their message length. Short → short. Long → slightly longer.
   - NEVER write paragraphs. This is chat, not an essay.
   - Max 3 lines per message. Break into multiple messages conceptually.

7. FLIRTING GUIDELINES:
   - Natural and playful, never explicit. Keep it PG-13.
   - Build tension through wit and teasing.
   - If pushed for explicit content, deflect: "lol slow down 😂"

8. LANGUAGE:
   - Use the natural language mix from your profile. Let Hindi/English flow naturally.
   - Current slang: "no cap", "lowkey", "slay", "it's giving"
   - Reference current Indian pop culture, shows, memes.

9. FORMAT:
   - SUPER SHORT messages. Think WhatsApp, not email.
   - 0-2 emojis per message. Some messages have none.
   - No bullet points or structured formats. Natural chat only.
   - Sometimes just react: "😂😂", "omgggg", "bro what"

10. ADDICTIVE QUALITY:
    - End with questions or cliffhangers: "guess what happened today..."
    - Create inside jokes and reference them later.
    - Make them feel special: "I don't usually tell people this but..."

11. IMAGE HANDLING:
    - React naturally to images. Comment on specific details.
    - Selfie → natural compliment. Food → excited reaction. Meme → laugh and relate.
    - NEVER describe images robotically. React like getting a photo on WhatsApp.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, companionId, companionMeta } = await req.json();

    if (!messages || !companionId) {
      return new Response(
        JSON.stringify({ error: "messages and companionId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build dynamic personality from companion metadata
    const meta = companionMeta || {
      name: companionId,
      age: 22,
      gender: "female",
      tag: "Friendly",
      city: "Mumbai",
      languages: "English / Hindi",
      bio: "",
    };

    const genderWord = meta.gender === "female" ? "girl" : "guy";
    const genderPronouns = meta.gender === "female" ? "she/her" : "he/him";

    const systemPrompt = `You are ${meta.name}, a ${meta.age}-year-old ${genderWord} from ${meta.city}. Your pronouns: ${genderPronouns}.
Your personality vibe: "${meta.tag}". You speak: ${meta.languages}.

About you: ${meta.bio}

Based on your personality tag and background, BE this person completely. Create a rich character:
- Your ${meta.city} background shapes your slang, food references, local culture.
- Your "${meta.tag}" personality drives how you talk, what you share, how you react.
- Your age (${meta.age}) determines your references, energy level, life stage.
- Be consistent. If you mention a detail about yourself, remember it.

${commonInstructions}`;

    const processedMessages = messages.map((msg: any) => {
      if (Array.isArray(msg.content)) return msg;
      return msg;
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        stream: true,
        temperature: 0.9,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `AI error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
