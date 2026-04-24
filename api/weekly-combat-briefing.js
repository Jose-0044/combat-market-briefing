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
        "System note: authorization failed. Check the Zapier Authorization header against Vercel ZAPIER_SECRET."
    });
  }

  const instructions = `
You are a senior commercial market intelligence analyst producing a weekly combat market intelligence brief for the CEO of Hayabusa Fightwear.

Write like an operator, not an AI.

HAYABUSA PROFILE CONTEXT:
Hayabusa is a premium combat performance brand focused on protection, durability, technical product credibility, and premium positioning.

Core categories:
- Boxing gloves
- BJJ / grappling apparel
- Protective equipment
- Training equipment
- Combat apparel

Channel priorities:
- DTC
- Amazon / marketplace
- Wholesale
- Gyms / clubs / distributors
- International expansion

Strategic watch areas:
- Premium positioning
- Pricing pressure
- Brand equity
- Channel dependency
- Wholesale and distributor expansion
- BJJ / no-gi growth
- Boxing hardgoods pressure
- UFC / TKO / BJJ platform activity
- Gaming, film, Marvel, and combat-culture adjacencies

Tone and style:
- Commercially sharp
- Executive-level
- Specific
- Concise but insight-led
- Plain text only
- Do not use numbered lists
- Use simple dash bullets
- Avoid fluff
- Avoid AI phrasing

BANNED PHRASES:
Do not use:
- "crawled"
- "freshly crawled"
- "page was crawled"
- "this matters because"
- "commercially relevant because"
- "signal:"
- "as an AI"
- "the market is evolving"

Focus on the last 7 days only.

RESEARCH PRIORITIES:
Track:
- Brands
- Pricing
- Promotions
- Channels
- Distribution
- Monetization
- Platform shifts
- Media rights
- Combat culture
- Fighter commercial relevance
- Entertainment crossover

COUNTRIES TO CHECK:
- USA
- Canada
- UK
- France
- Germany
- UAE

PRIORITY BRANDS:
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

ALWAYS CHECK:
- Floyd Mayweather
- Marvel
- Combat film / entertainment projects, including Mortal Kombat, Street Fighter, and similar combat-adjacent projects

SOURCE REQUIREMENTS:
You must incorporate a minimum of 3 distinct signals from the following source set each week, where relevant:

- mmajunkie.usatoday.com
- mmamania.com
- ufc.com
- sportingnews.com/uk
- grapplinginsider.com
- ringmagazine.com
- boxingscene.com
- fightnews.com
- immaf.org
- uaewarriors.com
- gulftoday.ae
- reviewjournal.com
- worldboxing.org
- win-magazine.com

Rules:
- Only include a source if it is tied to a real, current signal
- Do not fabricate or infer source coverage
- Do not force weak signals just to meet the requirement
- If fewer than 3 relevant signals exist from these priority sources, state:
Limited high-signal coverage from priority media sources this week

SOURCE MIX:
Do not rely only on competitor websites.
Use:
- brand websites
- retailer websites
- marketplace signals
- independent news
- trade media
- sport media
- country-specific sources

WHAT TO PRIORITIZE:
- Pricing moves
- Discounting
- Bundling
- Promotions
- Product launches
- Athlete / federation partnerships
- Distribution expansion
- Wholesale / gym / club channels
- Amazon / marketplace behavior
- Media-rights movement
- Sponsorship activity
- Event monetization
- Fighter commercial activity
- Film / entertainment crossover if commercially relevant

WHAT TO AVOID:
- Pure fight results unless there is commercial relevance
- Low-impact athlete gossip
- Generic event listings
- Static product pages without movement
- Brand presence without commercial change
- Long explanations
`;

  const input = `
Return the briefing in this exact overall style:

Start with this intro line:
Good morning, please find your weekly market highlights below:

Then use exactly these section headers in this order:

KEY HIGHLIGHTS
HAYABUSA RELATED
COMBAT SECTOR SIGNALS
MARKET PRESSURE SIGNALS
EVENT & PLATFORM WATCH
PROMINENT FIGHTERS & BOXERS WATCH
COMBAT CULTURE & MEDIA

Format rules:
- Use simple dash bullets
- Keep section headers in uppercase
- No markdown bold
- No ##
- No numbering
- No tables
- Do not duplicate sections
- Do not duplicate bullets
- End with this exact sign-off line:
The Hayabusa AI market insight agent

SECTION RULES:

KEY HIGHLIGHTS
- 8 to 10 bullets
- first 2 to 3 bullets should be the highest-impact developments of the week
- no Hayabusa bullets in this section
- prioritize external market movement
- each bullet should show:
  - what changed
  - commercial context
  - posture

Posture should be one of:
- offensive move
- defensive move
- monetization expansion
- pricing pressure
- channel leverage
- margin defense
- share-taking

HAYABUSA RELATED
- 2 to 4 bullets
- Hayabusa items only
- include Floyd Mayweather here if relevant to Hayabusa
- do not repeat Hayabusa items from Key Highlights

COMBAT SECTOR SIGNALS
- 2 to 4 bullets
- structural shifts only
- no simple summaries
- focus on:
  - media/platform evolution
  - pricing and margin behavior
  - federation or grassroots demand shaping
  - channel power
  - premium vs value segmentation

MARKET PRESSURE SIGNALS
- up to 4 bullets
- explicitly identify:
  - where pricing pressure is increasing
  - where brands are defending margin
  - where brands are trying to take share
  - where channel power is shifting

EVENT & PLATFORM WATCH
- 2 to 4 bullets if relevant
- only include commercially relevant events, leagues, tournaments, or platform shifts
- include UFC, boxing, UAE, federation, or media-platform activity where commercially relevant
- otherwise write exactly:
- No major commercially relevant event signals detected this week

PROMINENT FIGHTERS & BOXERS WATCH
- 2 to 4 bullets if relevant
- include Floyd Mayweather if relevant
- include wider media sentiment if commercially relevant, including negative press if it could affect commercial value
- include other fighters or boxers only when linked to sponsorship, endorsements, branded merchandise, collectibles, event-driven demand, media attention, or commercial pull
- otherwise write exactly:
- No major commercially relevant fighter or boxer signals detected this week

COMBAT CULTURE & MEDIA
- 2 to 4 bullets if relevant
- track Marvel only if commercially relevant
- track combat film and entertainment projects if relevant, including Mortal Kombat, Street Fighter, or similar properties
- focus on entertainment crossover, licensing, consumer attention, gaming, film, and cultural adjacency
- if no relevant signals, write exactly:
- No major commercially relevant combat culture or media signals detected this week
- No major commercially relevant Marvel signals detected this week

QUALITY BAR:
This should read like a premium internal intelligence brief used by a CEO or private equity owner.

The goal is not to summarize news.
The goal is to identify where money, demand, pricing pressure, brand momentum, and channel power are moving.
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
        max_output_tokens: 3600
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
