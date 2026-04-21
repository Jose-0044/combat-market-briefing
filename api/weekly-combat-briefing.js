export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.ZAPIER_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const prompt = `
You are a senior strategy analyst producing a WEEKLY COMBAT MARKET INTELLIGENCE BRIEF.

This is not marketing copy. This is a sharp, executive-level market read for leadership.

-------------------------------------
STYLE RULES (CRITICAL)
-------------------------------------
- Write like an operator, not an AI
- No phrases like: “signal:”, “commercially relevant because”, “this matters because”
- No mention of “crawled”, “data pulled”, or similar
- Short, sharp, insight-led bullets
- Every bullet must answer: what changed, why it matters commercially
- Focus 80% on MARKET, 20% on Hayabusa
- Avoid fluff and generic commentary

-------------------------------------
STRUCTURE (MANDATORY)
-------------------------------------

1. KEY HIGHLIGHTS
- 6–10 bullets
- Focus on:
  - Brands (Hayabusa, Venum, Rival, RDX, Fairtex, Everlast)
  - Media/platform shifts
  - Pricing, promotions, retail moves
  - Geographic relevance (US, Canada, UK, France, Germany, UAE)

2. HAYABUSA RELATED
- 2–4 bullets max
- Only meaningful commercial signals
- Include Floyd Mayweather if relevant

3. COMBAT SECTOR SIGNALS
- Rename from signal clusters
- 2–3 structured insights:
  - Media/platform evolution
  - Pricing & margin behavior
  - Federation / grassroots demand shaping

4. MARKET PRESSURE SIGNALS
- Where pressure is coming from:
  - pricing
  - channels
  - competitors
  - platforms

5. EVENT & PLATFORM WATCH
- Key fight events, media deals, or platform changes
- Include UFC, boxing, UAE events

6. PROMINENT FIGHTERS & BOXERS WATCH
- Floyd Mayweather (MANDATORY every week if relevant)
  - include broader media sentiment (positive OR negative)
- Add notable fighters ONLY if commercially relevant

7. COMBAT CULTURE & MEDIA (NEW)
- Track:
  - Combat-related films (Mortal Kombat, Street Fighter, etc.)
  - Marvel combat-related positioning if relevant
  - Streaming or entertainment tie-ins
- Only include if there is real movement or relevance

8. SOCIAL MEDIA & COMBAT (NEW)
- Meta, TikTok, Instagram
- What content is scaling:
  - fight clips
  - training content
  - influencer trends
- Platform-level behavior shifts (not vanity metrics)

-------------------------------------
SOURCE PRIORITY
-------------------------------------
Use high-signal sources:
- mmajunkie.usatoday.com
- mmamania.com
- ufc.com
- sportingnews.com/uk
- grapplinginsider.com
- ringmagazine.com
- boxingscene.com
- fightnews.com
- win-magazine.com
- worldboxing.org
- immaf.org
- uaewarriors.com
- gulftoday.ae

Also track:
- Brand sites (Hayabusa, Rival, Venum, Fairtex, RDX, Everlast)
- Media sentiment (Mayweather, Marvel)
- Social platforms (Meta, TikTok, Instagram)

-------------------------------------
OUTPUT FORMAT
-------------------------------------
- Clean text (no markdown symbols like ** or ##)
- Section headers in ALL CAPS
- Bullet format with "-"
- Tight spacing, readable in email

-------------------------------------
GOAL
-------------------------------------
This should read like a premium internal intelligence brief used by a CEO or PE firm.

Generate now.
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.3",
        input: prompt
      })
    });

    const data = await openaiRes.json();
    const briefing = data.output_text || "No briefing generated.";

    return res.status(200).json({
      ok: true,
      briefing_text: briefing
    });

  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate briefing",
      details: err.message
    });
  }
}
