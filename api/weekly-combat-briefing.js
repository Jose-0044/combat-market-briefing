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
      briefing_text: "System note: ZAPIER_SECRET missing."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      ok: true,
      briefing_text: "System note: OPENAI_API_KEY missing."
    });
  }

  if (normalize(auth) !== normalize(expected)) {
    return res.status(200).json({
      ok: true,
      briefing_text: "System note: authorization failed."
    });
  }

  const prompt = `
You are a senior commercial market intelligence analyst producing a weekly combat market briefing.

Use live web search, but keep research efficient.

GOAL:
Identify 8–10 commercially relevant market signals from the last 7 days.

FOCUS AREAS:
- Brand activity (Hayabusa, Venum, Rival, RDX, Fairtex, Everlast, Tatami, Scramble)
- Pricing / discounting / promotions
- Marketplace dynamics (Amazon, DTC, wholesale)
- Distribution / expansion
- Media / platform monetization (UFC, DAZN, etc.)
- Event-driven demand
- Fighter commercial relevance (Floyd Mayweather if applicable)
- Combat culture / entertainment crossover (Marvel, gaming, film) only if meaningful

PRIORITIZE:
- Pricing pressure
- Channel power shifts
- Brand momentum
- Demand signals
- Monetization expansion

AVOID:
- Fight results without commercial relevance
- Weak or filler signals
- AI-style phrasing

FORMAT EXACTLY:

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

RULES:
- Output once only
- No repetition
- Plain text
- No markdown
- No numbering
- Simple dash bullets

KEY HIGHLIGHTS:
- 8 to 10 bullets
- external only (no Hayabusa)

HAYABUSA RELATED:
- 2 to 3 bullets

COMBAT SECTOR SIGNALS:
- 2 to 3 bullets

MARKET PRESSURE SIGNALS:
- up to 3 bullets

EVENT & PLATFORM WATCH:
- 1 to 3 bullets OR fallback line

PROMINENT FIGHTERS & BOXERS WATCH:
- 1 to 3 bullets OR fallback line

COMBAT CULTURE & MEDIA:
- 1 to 2 bullets OR fallback line
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
        max_output_tokens: 2600
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        ok: true,
        briefing_text: `System note: OpenAI failed (${response.status})`
      });
    }

    const raw = extractOutputText(data);

    if (!raw) {
      return res.status(200).json({
        ok: true,
        briefing_text: "No briefing generated."
      });
    }

    const cleaned = removeDuplicateBriefing(raw);

    return res.status(200).json({
      ok: true,
      briefing_text: cleaned
    });

  } catch (error) {
    return res.status(200).json({
      ok: true,
      briefing_text: `System note: runtime error: ${error.message}`
    });
  }
}
