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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = (req.headers.authorization || "").trim();
  const expected = `Bearer ${process.env.ZAPIER_SECRET || ""}`.trim();

  if (!process.env.ZAPIER_SECRET) {
    return res.status(200).json({
      ok: true,
      briefing_text: "System note: ZAPIER_SECRET is missing in Vercel environment variables."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      ok: true,
      briefing_text: "System note: OPENAI_API_KEY is missing in Vercel environment variables."
    });
  }

  if (auth !== expected) {
    return res.status(200).json({
      ok: true,
      briefing_text: "System note: authorization failed. Check the Zapier Authorization header against Vercel ZAPIER_SECRET."
    });
  }

  const instructions = `
You are a senior strategy analyst producing a weekly combat market intelligence brief for the CEO of Hayabusa Fightwear.

Write like an operator, not an AI.
Do not use markdown symbols such as ## or **.
Do not say "Good morning".
Do not mention crawling, scraping, data pulls, or source retrieval mechanics.

Focus on the last 7 days only.

Research priorities:
- Track brands, pricing, promotions, channels, distribution, monetization, platform shifts
- Search beyond brand-owned sites and include independent media and trade coverage
- Countries: USA, Canada, UK, France, Germany, UAE
- Brands: Hayabusa, Venum, Rival, RDX, Fairtex, Tatami, Scramble, Everlast, Sanabul, Engage, TITLE Boxing
- Always check for relevant developments on Floyd Mayweather and Marvel

Priority sources when relevant:
mmajunkie.usatoday.com
mmamania.com
ufc.com
sportingnews.com/uk
grapplinginsider.com
reviewjournal.com
ringmagazine.com
boxingscene.com
win-magazine.com
worldboxing.org
fightnews.com
uaewarriors.com
gulftoday.ae
immaf.org
`;

  const input = `
Return clean plain text only, using exactly these section headers:

KEY HIGHLIGHTS
HAYABUSA RELATED
SIGNAL CLUSTERS
MARKET PRESSURE SIGNALS
EVENT & PLATFORM WATCH
PROMINENT FIGHTERS & BOXERS WATCH

Format:
- Use simple dash bullets
- No markdown bold
- No numbering
- No intro paragraph
- No closing signature

Rules by section:

KEY HIGHLIGHTS
- 8 to 10 bullets
- first 2 to 3 bullets should be the highest-impact developments of the week
- no Hayabusa bullets in this section

HAYABUSA RELATED
- 2 to 4 bullets
- Hayabusa items only
- include Floyd Mayweather here if relevant

SIGNAL CLUSTERS
- 2 to 4 bullets
- structural shifts across brands, pricing, distribution, media, participation, or platform economics

MARKET PRESSURE SIGNALS
- up to 4 bullets
- explicitly identify pricing pressure, margin defense, share-taking, and channel shifts

EVENT & PLATFORM WATCH
- 2 to 4 bullets if relevant
- otherwise write exactly:
- No major commercially relevant event signals detected this week

PROMINENT FIGHTERS & BOXERS WATCH
- 2 to 4 bullets if relevant
- include Floyd Mayweather if relevant
- include wider media sentiment if commercially relevant
- include Marvel if relevant to fighters/combat/entertainment crossover
- otherwise write exactly:
- No major commercially relevant fighter or boxer signals detected this week
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
        instructions,
        input,
        max_output_tokens: 3200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        ok: true,
        briefing_text: `System note: OpenAI request failed with status ${response.status}.`
      });
    }

    const briefingText = extractOutputText(data);

    if (!briefingText) {
      return res.status(200).json({
        ok: true,
        briefing_text: "No briefing generated."
      });
    }

    return res.status(200).json({
      ok: true,
      briefing_text: briefingText
    });
  } catch (error) {
    return res.status(200).json({
      ok: true,
      briefing_text: `System note: runtime error during briefing generation: ${error.message || String(error)}`
    });
  }
}
