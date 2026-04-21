function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTextToHtml(text) {
  const lines = String(text || "").split("\n");
  let html = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    // Section headers (we control formatting)
    if (
      line === "KEY HIGHLIGHTS" ||
      line === "HAYABUSA RELATED" ||
      line === "SIGNAL CLUSTERS" ||
      line === "MARKET PRESSURE SIGNALS" ||
      line === "EVENT & PLATFORM WATCH" ||
      line === "PROMINENT FIGHTERS & BOXERS WATCH"
    ) {
      html += `<h2 style="margin:24px 0 12px;font-size:18px;font-weight:bold;">${escapeHtml(line)}</h2>`;
      continue;
    }

    // Bullets
    if (line.startsWith("- ")) {
      html += `<p style="margin:0 0 10px 0;line-height:1.6;">• ${escapeHtml(
        line.slice(2)
      )}</p>`;
      continue;
    }

    html += `<p style="margin:0 0 10px 0;line-height:1.6;">${escapeHtml(
      line
    )}</p>`;
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
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        tools: [{ type: "web_search" }],
        max_output_tokens: 3500,
        input: `
You are a commercial market intelligence agent.

OUTPUT FORMAT RULES (STRICT):

- NO markdown formatting
- NO ##
- NO **
- NO bold symbols
- Use clean plain text only

Structure EXACTLY like this:

KEY HIGHLIGHTS
- bullet
- bullet

HAYABUSA RELATED
- bullet

SIGNAL CLUSTERS
- bullet

MARKET PRESSURE SIGNALS
- bullet

EVENT & PLATFORM WATCH
- bullet

PROMINENT FIGHTERS & BOXERS WATCH
- bullet

---

CONTENT RULES:

1. KEY HIGHLIGHTS
- 8–10 bullets
- FIRST 2–3 = most important
- NO Hayabusa content here

2. HAYABUSA RELATED
- ONLY Hayabusa insights
- Pull out from main signals

3. SIGNAL CLUSTERS
- structural changes only
- no repetition

4. REMOVE any repetitive competitor summary section

5. CLEAN STYLE
- no markdown artifacts
- no symbols like ** or ##
- executive email tone

---

RESEARCH RULES:

- Must search:
USA, Canada, UK, France, Germany, UAE

- Must track:
Hayabusa, Venum, Rival, RDX, Fairtex, Tatami, Scramble, Everlast, Sanabul

- Must include if relevant:
Marvel
Floyd Mayweather

If none:
say explicitly

- Must prioritize:
mmajunkie, mmamania, ufc.com, sportingnews UK,
grapplinginsider, ringmagazine, boxingscene,
fightnews, UAE Warriors, IMMAF

---

OUTPUT MUST BE CLEAN EMAIL FORMAT
NO markdown
NO symbols
NO duplication
        `
      })
    });

    const data = await response.json();

    const briefingText =
      data.output_text ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap(item =>
              Array.isArray(item.content) ? item.content : []
            )
            .filter(
              c => c.type === "output_text" && c.text
            )
            .map(c => c.text)
            .join("\n")
        : "");

    const briefingHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:900px;margin:auto;">
        <div style="padding:20px;border-bottom:1px solid #ddd;">
          <img src="${logoUrl}" style="max-height:50px;" />
        </div>
        <div style="padding:20px;">
          ${formatTextToHtml(briefingText)}
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
      error: error.message
    });
  }
}
