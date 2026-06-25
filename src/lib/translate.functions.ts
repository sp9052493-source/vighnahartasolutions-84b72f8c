import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  fields: z.record(z.string().max(40), z.string().max(600)),
});

/**
 * Translate / transliterate English government-form values into Marathi
 * (Devanagari). Names and addresses are phonetically transliterated; other
 * descriptive text is translated by meaning. Uses the Lovable AI Gateway.
 */
export const translateToMarathi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Translation service is not configured.");

    const entries = Object.entries(data.fields).filter(([, v]) => v && v.trim());
    if (!entries.length) return { translations: {} as Record<string, string> };

    const payload = Object.fromEntries(entries);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You convert English values from an Indian (Maharashtra) government form into Marathi using Devanagari script. For person names, father/husband names, villages, talukas and districts use accurate phonetic transliteration. For addresses transliterate proper nouns and translate generic words. For purpose/notes translate the meaning naturally. Return ONLY a JSON object mapping each input key to its Marathi string. Do not add keys or commentary.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Translation rate limit reached. Please try again shortly.");
    if (!res.ok) {
      console.error("[TRANSLATE] gateway error", res.status, await res.text().catch(() => ""));
      throw new Error("Translation service is unavailable right now.");
    }

    const json: any = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let translations: Record<string, string> = {};
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string") translations[k] = v;
        }
      }
    } catch {
      translations = {};
    }
    return { translations };
  });
