function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToHtml(text) {
  const lines = String(text || "").split("\n");
  let html = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const upper = line.toUpperCase();

    if (
      upper === "KEY HIGHLIGHTS" ||
      upper === "HAYABUSA RELATED" ||
      upper === "SIGNAL CLUSTERS" ||
      upper === "MARKET PRESSURE SIGNALS" ||
      upper === "EVENT & PLATFORM WATCH" ||
      upper === "PROMINENT FIGHTERS & BOXERS WATCH"
    ) {
      html += `<h2 style="margin:24px 0 12px;font-size:18px;font-weight:700;">${escapeHtml(line)}</h2>`;
      continue;
    }

    if (line.startsWith("- ")) {
      html += `<p style="margin:0 0 10px 0;line-height:1.6;">• ${escapeHtml(line.slice(2))}</p>`;
      continue;
    }

    html += `<p style="margin:0 0 10px 0;line-height:1.6;">${escapeHtml(line)}</p>`;
  }

  return html;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = (req.headers.authorization || "").trim();
  const expected = `Bearer ${process.env.ZAPIER_SECRET}`.trim();

  if (auth !== expected) {
    return res.status(401).json({
      error: "Unauthorized",
      received: auth
    });
  }

  try {
    const logoUrl = process.env.LOGO_URL || "";

    const prompt = `
You are a commercial market intelligence agent focused on global combat sports.

You are writing for Jordan Searle, CEO of Hayabusa Fightwear.

Write the output as a clean executive email in PLAIN TEXT only.

STRICT FORMAT RULES:
- Do NOT use markdown
- Do NOT use ##
- Do NOT use **
- Do NOT use tables
- Do NOT add an intro paragraph
- Do NOT add a closing paragraph
- Do NOT write "Good morning"

Use this exact section structure:

KEY HIGHLIGHTS
- bullet
- bullet

HAYABUSA RELATED
- bullet
- bullet

SIGNAL CLUSTERS
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

CONTENT RULES:
- Focus on the last 7 days only
- Prioritize brands, pricing, channels, distribution, monetization
- Events only if commercially relevant
- Fighters/boxers only if commercially relevant
- Keep bullets tight and commercially sharp
- No fluff
- No repetition
- No generic observations

RESEARCH RULES:
You MUST research beyond competitor websites.
Use:
- official brand / retailer / promotion websites
- independent news coverage
- trade / sport media coverage
- country-specific coverage

You MUST search for relevant brand and market signals in:
- USA
- Canada
- UK
- France
- Germany
- UAE

Priority brands to track:
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

You MUST explicitly check for relevant developments involving:
- Marvel
- Floyd Mayweather

If there are no meaningful commercial developments for Marvel or Floyd Mayweather this week, say so explicitly in the appropriate section.

Prioritize these sources when relevant:
- mmajunkie.usatoday.com
- mmamania.com
- ufc.com
- sportingnews.com/uk
- grapplinginsider.com
- reviewjournal.com
- ringmagazine.com
- boxingscene.com
- win-magazine.com
- worldboxing.org
- fightnews.com
- uaewarriors.com
- gulftoday.ae
- immaf.org

SIGNAL RULES:
- Every bullet must reference something real:
  brand, company, event, athlete, boxer, retailer, distributor, platform, promotion, or geography
- Every signal must answer:
  "How does money move differently because of this?"
- Only include signals that indicate at least one of:
  1. a company is making money differently
  2. a brand is trying to take share
  3. a platform is increasing monetization
  4. a price or promotion is changing behavior
  5. a channel is expanding or contracting

Exclude:
- static product listings without change
- general brand presence without movement
- retailer descriptions without activity
- legacy SKUs unless tied to pricing, refresh, or push

OUTPUT RULES BY SECTION:

KEY HIGHLIGHTS
- 8 to 10 bullets
- first 2 to 3 bullets must be the highest-impact signals of the week
- minimum 4 brand-related signals
- minimum 2 channel or pricing related signals
- maximum 2 event-driven signals in this section
- NO Hayabusa bullets in this section
- each bullet must include:
  - what happened
  - commercial context
  - signal type
  - posture
- posture must be one of:
  - offensive move
  - defensive move
  - monetization expansion
  - pricing pressure
  - channel leverage

HAYABUSA RELATED
- 2 to 4 bullets
- Hayabusa items only
- include only real current signals
- separate Hayabusa from competitor activity

SIGNAL CLUSTERS
- 2 to 4 bullets
- identify structural shifts, not summaries
- combine 2 to 3 supporting signals where possible
- explain what is changing in pricing, competition, or channel dynamics

MARKET PRESSURE SIGNALS
- up to 4 bullets
- explicitly identify:
  - where pricing pressure is increasing
  - where brands are defending margin
  - where brands are trying to take share
  - where channel power is shifting

EVENT & PLATFORM WATCH
- 2 to 4 bullets if relevant
- only include commercially relevant events/platform items
- if none, write exactly:
- No major commercially relevant event signals detected this week

PROMINENT FIGHTERS & BOXERS WATCH
- 2 to 4 bullets if relevant
- only include fighters or boxers with clear commercial relevance:
  - sponsorships
  - endorsements
  - branded merchandise
  - collectibles
  - event-driven demand pull
  - crossover media momentum with visible commercial effect
- must explicitly address Floyd Mayweather if relevant
- must explicitly address Marvel if relevant
- if no relevant fighter/boxer items, write exactly:
- No major commercially relevant fighter or boxer signals detected this week
- No major commercially relevant Marvel signals detected this week

OUTPUT COMPLETION RULE:
You MUST fully complete all sections above.
If nearing output limits, shorten lower-priority bullets rather than cutting off the final sections.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        tools: [{ type: "web_search" }],
        tool_choice: "auto",
        max_output_tokens: 4000,
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        error: JSON.stringify(data)
      });
    }

    const briefingText =
      data.output_text ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap(item => Array.isArray(item.content) ? item.content : [])
            .filter(item => item.type === "output_text" && item.text)
            .map(item => item.text)
            .join("\n")
        : "") ||
      "No briefing generated";

    const briefingHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:900px;margin:0 auto;background:#ffffff;color:#111;">
        <div style="padding:20px 20px 12px;border-bottom:1px solid #e5e5e5;">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height:50px;display:block;" />` : ""}
        </div>
        <div style="padding:20px;">
          ${textToHtml(briefingText)}
        </div>
      </div>
    `;

    return res.status(200).json({
      ok: true,
      briefing_text: briefingText,
      briefing_html: briefingHtml
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || String(error)
    });
  }
}
