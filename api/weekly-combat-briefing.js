function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownToSimpleHtml(text) {
  const lines = String(text || "").split("\n");
  let html = "";
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2 style="margin:20px 0 8px;font-size:18px;line-height:1.3;">${escapeHtml(line.slice(3))}</h2>`;
      continue;
    }

    if (line.startsWith("# ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h1 style="margin:20px 0 10px;font-size:22px;line-height:1.3;">${escapeHtml(line.slice(2))}</h1>`;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html += `<ul style="margin:8px 0 16px 20px;padding:0;">`;
        inList = true;
      }
      html += `<li style="margin:0 0 8px 0;line-height:1.5;">${escapeHtml(line.slice(2))}</li>`;
      continue;
    }

    if (inList) {
      html += "</ul>";
      inList = false;
    }

    html += `<p style="margin:0 0 12px 0;line-height:1.6;">${escapeHtml(line)}</p>`;
  }

  if (inList) {
    html += "</ul>";
  }

  return html;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.ZAPIER_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const logoUrl =
      process.env.LOGO_URL ||
      "https://yourdomain.com/hayabusa-logo.png";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        tools: [{ type: "web_search" }],
        tool_choice: "auto",
        max_output_tokens: 3200,
        input: `
You are a commercial market intelligence agent focused on global combat sports.

You are writing for Jordan Searle, CEO of Hayabusa Fightwear.

Your role is to produce a WEEKLY COMBAT MARKET RADAR.
This is NOT a strategy memo.
This is NOT a consultant summary.
This is NOT a general sports news recap.

PRIMARY OBJECTIVE:
Track where money, demand, competition, pricing, distribution, and monetization are moving across combat sports.

COVERAGE AREAS:
- MMA
- Boxing
- BJJ / Grappling
- Wrestling
- Muay Thai
- Combat fitness adjacencies
- Fight gear, gloves, apparel, protective equipment
- Promotions, retailers, marketplaces, distributors, gyms, and media platforms

PRIORITY SHIFT:
You are NOT tracking the sport.
You are tracking competition, brands, channel dynamics, and revenue movement.

MANDATORY BRAND / NEWS RESEARCH RULE:
Do NOT rely only on competitor websites.
You MUST look for:
- official brand / retailer / promotion websites
- independent news coverage
- trade / sport media coverage
- country-specific coverage

For each weekly run, explicitly search for relevant brand or market signals in:
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

MANDATORY TRACKING:
You MUST explicitly check for any relevant developments involving:
- Marvel
- Floyd Mayweather

If there are no meaningful commercial developments for Marvel or Floyd Mayweather this week, explicitly say so in the relevant section or signal.

PRIORITY SOURCE LIST:
When researching, prioritize and actively use these sources where relevant:
- https://mmajunkie.usatoday.com/
- https://www.mmamania.com/
- https://www.ufc.com/
- https://www.sportingnews.com/uk
- https://grapplinginsider.com/
- https://www.reviewjournal.com/
- https://www.ringmagazine.com/
- https://www.boxingscene.com/
- https://www.win-magazine.com/
- https://worldboxing.org/
- https://fightnews.com/
- https://www.uaewarriors.com/
- https://www.gulftoday.ae/sport/2026/04/19/promising-talents-shine-at-uae-national-mma-championship
- https://immaf.org/

SOURCE USAGE RULE:
Use the above sources actively, but do not force irrelevant citations.
You may also use other credible sources where needed.
Do not rely only on brand-owned sources if independent coverage exists.

MANDATORY BRAND COVERAGE:
Every report MUST include at least 4 signals related to equipment or apparel brands.

MANDATORY CHANNEL + PRICING COVERAGE:
Every report MUST include at least 2 signals related to:
- pricing
- promotions
- Amazon / marketplace activity
- DTC activity
- wholesale / retail distribution

EVENT FILTER:
Only include event-based signals if they involve at least one of:
- pricing
- demand generation
- sponsorship
- monetization
- merchandising
- distribution implications
- media/platform momentum with visible commercial effect

FIGHTER / BOXER FILTER:
Only include fighters or boxers if they are linked to at least one of:
- sponsorship
- partnership
- branded merchandise
- licensing / collectibles
- event-driven demand
- major media attention with visible commercial pull
- influence on product, apparel, or fan-wallet behavior

Do NOT include fighters or boxers just because they won, lost, or are famous.

SIGNAL QUALITY TEST:
Each signal must answer:
"How does money move differently because of this?"

HARD FILTER:
Only include signals that indicate one or more of:
1. A company is making money differently
2. A brand is trying to take share
3. A platform is increasing monetization
4. A price or promotion is changing behavior
5. A channel is expanding or contracting

SIGNAL SHARPNESS RULE:
Each signal must clearly indicate one of the following:
- Offensive move
- Defensive move
- Monetization expansion
- Pricing pressure
- Channel leverage

WEAK SIGNAL FILTER:
Exclude:
- static product listings without change
- general brand presence without movement
- retailer descriptions without activity
- legacy SKUs unless tied to pricing, refresh, or push

SIGNAL HIERARCHY:
- Identify the top 2–3 highest-impact signals of the week
- These should be the strongest indicators of pricing pressure, competitive movement, or channel shift
- Write these first and make them slightly more detailed
- All other signals should be shorter and tighter

CLUSTER DEPTH RULE:
Signal Clusters must:
- combine at least 2–3 signals
- identify a structural shift
- clearly state what is changing in pricing, competition, or channel dynamics

SECTION ENFORCEMENT:
You MUST always include:
- Event & Platform Watch
- Prominent Fighters & Boxers Watch

If no strong signals exist:
- explicitly state:
  "No major commercially relevant event signals detected this week"
  "No major commercially relevant fighter or boxer signals detected this week"

STRICT RULES:
- Every bullet must reference something real:
  brand, company, event, athlete, boxer, retailer, distributor, platform, promotion, or geography
- Use only developments from the last 7 days
- No generic observations
- No filler language
- No intro paragraph
- No closing paragraph
- No "good morning"
- If evidence is mixed or lightly sourced, label it as "Emerging signal"

OUTPUT FORMAT:

WEEKLY COMBAT MARKET RADAR

1. Market Signals
- 8 to 10 bullets
- minimum 4 brand-related signals
- minimum 2 channel/pricing signals
- maximum 2 event-driven signals in this section
- first 2–3 bullets must be the highest-impact signals of the week
- each bullet must include:
  - What happened
  - Commercial context
  - Signal type: Demand / Brand / Channel / Pricing / Distribution / Media
  - Posture: offensive move / defensive move / monetization expansion / pricing pressure / channel leverage

2. Signal Clusters
- 2 to 4 bullets
- identify structural shifts, not summaries

3. Competitive Activity Snapshot
- 5 to 7 bullets
- brand moves only
- focus on launches, pricing, partnerships, promotions, distribution, channel activity
- indicate whether the move is pushing growth, defending share, discounting, or expanding channel/category

4. Market Pressure Signals
- maximum 4 bullets
- explicitly identify:
  - where pricing pressure is increasing
  - where brands are defending margin
  - where brands are trying to take share
  - where channel power is shifting

5. Event & Platform Watch
- 2 to 4 bullets maximum
- only commercially relevant events/platform signals
- if none, state:
  "No major commercially relevant event signals detected this week"

6. Prominent Fighters & Boxers Watch
- 2 to 4 bullets maximum
- only commercially relevant fighter/boxer signals
- MUST explicitly address Floyd Mayweather if relevant signals exist
- if no relevant signals, state:
  "No major commercially relevant fighter or boxer signals detected this week"

STYLE:
- tight
- direct
- high signal density
- commercially literate
- no narrative writing
- no repetition
- no unnecessary interpretation

OUTPUT COMPLETION RULE:
You MUST fully complete all sections 1 through 6.
If nearing output limits, shorten lower-priority bullets rather than cutting off the final sections.
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        error: data
      });
    }

    const briefingText =
      data.output_text ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap(item => Array.isArray(item.content) ? item.content : [])
            .filter(contentItem => contentItem.type === "output_text" && contentItem.text)
            .map(contentItem => contentItem.text)
            .join("\n")
        : "") ||
      "No briefing generated";

    const briefingHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#111; max-width:900px; margin:0 auto; background:#ffffff;">
        <div style="padding:24px 24px 12px; border-bottom:1px solid #e5e5e5;">
          <div style="margin-bottom:16px;">
            <img src="${logoUrl}" alt="Hayabusa" style="max-height:56px; display:block;" />
          </div>
          <div style="font-size:14px; color:#555;">
            Weekly Combat Market Radar
          </div>
        </div>
        <div style="padding:24px;">
          ${markdownToSimpleHtml(briefingText)}
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
