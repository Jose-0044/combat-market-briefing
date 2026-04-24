function extractOutputText(data) {
  if (!data) return "";

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data.output)) return "";

  const parts = [];

  for (const item of data.output) {
    if (!item) continue;

    if (item.type === "message" && Array.isArray(item.content)) {
      for (const content of item.content) {
        if (
          content &&
          content.type === "output_text" &&
          typeof content.text === "string" &&
          content.text.trim()
        ) {
          parts.push(content.text.trim());
        }
      }
    }

    if (typeof item.text === "string" && item.text.trim()) {
      parts.push(item.text.trim());
    }

    if (Array.isArray(item.content)) {
      for (const content of item.content) {
        if (typeof content?.text === "string" && content.text.trim()) {
          parts.push(content.text.trim());
        }
      }
    }
  }

  return parts.join("\n\n").trim();
}

function removeDuplicateBriefing(text) {
  if (!text) return "";

  const marker = "Good morning, please find your weekly market highlights below:";
  const firstIndex = text.indexOf(marker);

  if (firstIndex === -1) return text.trim();

  const secondIndex = text.indexOf(marker, firstIndex + marker.length);

  if (secondIndex === -1) return text.trim();

  return text.slice(firstIndex, secondIndex).trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = (req.headers.authorization || "").trim();
  const expected = `Bearer ${process.env.ZAPIER_SECRET || ""}`.trim();
  const normalize = (str) => String(str || "").replace(/\s+/g, " ").trim();

  if (!process.env.ZAPIER_SECRET) {
    return res.status(200).json({
      ok: true,
      briefing_text:
        "System note: ZAPIER_SECRET is missing in Vercel environment variables."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      ok: true,
      briefing_text:
        "System note: OPENAI_API_KEY is missing in Vercel environment variables."
    });
  }

  if (normalize(auth) !== normalize(expected)) {
    return res.status(200).json({
      ok: true,
      briefing_text:
        "System note: authorization failed. Check Zapier Authorization header and Vercel ZAPIER_SECRET."
    });
  }

  const prompt = `
You are a senior commercial market intelligence analyst producing a weekly combat market briefing for the CEO of Hayabusa Fightwear.

Use live web search, but keep the research narrow and efficient.

Goal:
Find 5 to 7 current, commercially relevant combat market signals from the last 7 days.

Hayabusa context:
- Premium combat performance brand
- Core categories: boxing gloves, BJJ/grappling apparel, protective equipment, combat apparel
- Key channels: DTC, Amazon, wholesale, gyms, distributors, international expansion
- Key watch areas: premium positioning, pricing pressure, BJJ/no-gi growth, boxing hardgoods pressure, UFC/TKO/BJJ activity, gaming/film/combat culture adjacencies

Prioritize:
- Brand moves
- Pricing / promotions
- Channel shifts
- Distribution
- Media/platform monetization
- Event monetization
- Fighter or boxer commercial relevance
- Combat culture/media only if commercially relevant

Track if visible:
- Hayabusa
- Venum
- Rival
- RDX
- Fairtex
- Tatami
- Scramble
- Everlast
- Sanabul
- Engage
- TITLE Boxing
- Floyd Mayweather
- Marvel
- Mortal Kombat
- Street Fighter

Use credible current public sources.
Do not force weak items.
Do not over-search.
Do not mention crawling, scraping, or data retrieval.
Do not use phrases like "this matters because", "commercially relevant because", or "signal:".

Return the briefing ONCE ONLY in this exact format:

Good morning, please find your weekly market highlights below:

KEY HIGHLIGHTS
- bullet
- bullet

HAYABUSA RELATED
- bullet
- bullet

COMBAT SECTOR SIGNALS
- bullet
- bullet

MARKET PRESSURE SIGNALS
- bullet
- bullet

EVENT & PLATFORM WATCH
- bullet
- bullet

PROMINENT FIGHTERS & BOXERS WATCH
- bullet
- bullet

COMBAT CULTURE & MEDIA
- bullet
- bullet

The Hayabusa AI market insight agent

Rules:
- Plain text only
- No markdown
- No ##
- No **
- No numbered lists
- Simple dash bullets only
- No duplicate sections
- No duplicate bullets
- Do not repeat the briefing
- Keep it concise

KEY HIGHLIGHTS:
- 5 to 7 bullets
- external market only
- no Hayabusa bullets

HAYABUSA RELATED:
- 1 to 3 bullets
- Hayabusa only
- include Mayweather if relevant to Hayabusa

COMBAT SECTOR SIGNALS:
- 2 bullets max
- structural market shifts only

MARKET PRESSURE SIGNALS:
- 2 bullets max
- pricing pressure, margin defense, share-taking, channel power

EVENT & PLATFORM WATCH:
- 1 to 2 bullets if relevant
- otherwise write:
- No major commercially relevant event signals detected this week

PROMINENT FIGHTERS & BOXERS WATCH:
- 1 to 2 bullets if relevant
- include Floyd Mayweather if relevant
- otherwise write:
- No major commercially relevant fighter or boxer signals detected this week

COMBAT CULTURE & MEDIA:
- 1 to 2 bullets if relevant
- include Marvel, Mortal Kombat, Street Fighter, gaming, film, entertainment crossover if commercially relevant
- otherwise write:
- No major commercially relevant combat culture or media signals detected this week
- No major commercially relevant Marvel signals detected this week
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        reasoning: { effort: "low" },
        tools: [{ type: "web_search" }],
        input: prompt,
        max_output_tokens: 2200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        ok: true,
        briefing_text: `System note: OpenAI web-search request failed with status ${response.status}.`
      });
    }

    const rawBriefingText = extractOutputText(data);

    if (!rawBriefingText) {
      return res.status(200).json({
        ok: true,
        briefing_text: "No briefing generated."
      });
    }

    const briefingText = removeDuplicateBriefing(rawBriefingText);

    return res.status(200).json({
      ok: true,
      briefing_text: briefingText
    });
  } catch (error) {
    return res.status(200).json({
      ok: true,
      briefing_text: `System note: runtime error during web-search briefing generation: ${error.message || String(error)}`
    });
  }
}
