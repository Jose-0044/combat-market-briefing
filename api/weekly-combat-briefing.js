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

  // SAFE AUTH HANDLING
  const auth = (req.headers.authorization || "").trim();
  const expected = `Bearer ${process.env.ZAPIER_SECRET}`.trim();

  if (auth !== expected) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
      received: auth
    });
  }

  try {
    const logoUrl = process.env.LOGO_URL || "";

    const prompt = `
You are a commercial market intelligence agent focused on global combat sports.

You are writing for the CEO of Hayabusa Fightwear.

Write a clean executive email in PLAIN TEXT.

STRICT RULES:
- NO markdown
- NO ##
- NO **
- NO intro
- NO closing

STRUCTURE:

KEY HIGHLIGHTS
- bullets

HAYABUSA RELATED
- bullets

SIGNAL CLUSTERS
- bullets

MARKET PRESSURE SIGNALS
- bullets

EVENT & PLATFORM WATCH
- bullets

PROMINENT FIGHTERS & BOXERS WATCH
- bullets

RULES:
- Last 7 days only
- Focus on brands, pricing, distribution, monetization
- Use USA, Canada, UK, France, Germany, UAE
- Track: Hayabusa, Venum, Rival, RDX, Fairtex, Tatami, Scramble, Everlast, Sanabul
- Include Marvel + Floyd Mayweather if relevant
- Use sources like MMA Junkie, UFC, Ring Magazine, Boxingscene, IMMAF, UAE Warriors

If no events:
- write "No major commercially relevant event signals detected this week"

If no fighters:
- write both:
- No major commercially relevant fighter or boxer signals detected this week
- No major commercially relevant Marvel signals detected this week
`;

    // 🔥 FIXED API CALL (stable config)
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5",
        tools: [{ type: "web_search_preview" }],
        max_output_tokens: 3000,
        input: prompt
      })
    });

    const data = await response.json();

    // 🔍 FULL ERROR VISIBILITY
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        openai_error: data
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
        <div style="padding:20px;border-bottom:1px solid #e5e5e5;">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" style="max-height:50px;" />` : ""}
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
      error: error.message,
      stack: error.stack
    });
  }
}
