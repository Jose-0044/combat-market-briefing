export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.ZAPIER_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
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
        max_output_tokens: 1400,
        input: `
You are preparing a weekly market intelligence briefing for Jordan Searle, CEO of Hayabusa Fightwear.

This is NOT a generic summary.
This is NOT a playbook.
This is NOT hypothetical.

Your job is to identify REAL signals from the last 7 days and interpret them commercially.

Only include signals that meet at least one of these:
- A brand did something: launch, collab, sponsorship, athlete signing, pricing move, promotion, distribution move
- A platform or event created visible demand: UFC, IBJJF, major boxing cards, regional circuits, gyms, wholesalers, marketplaces
- A channel signal is visible: Amazon, DTC, wholesale, retail, distributor, geography
- A visible consumer or category momentum signal emerged

STRICT RULES:
- Every bullet MUST reference something real: brand, event, athlete, company, platform, or geography
- If you do not have a clear signal, synthesize a trend only if you explain what evidence supports it
- Do NOT invent vague seasonality or obvious demand spikes
- Do NOT write like a consultant
- Do NOT give generic advice
- Do NOT include filler
- No intro paragraph
- No closing paragraph

OUTPUT FORMAT:

WEEKLY COMBAT MARKET INTELLIGENCE

1. Top Signals
- Maximum 5 bullets
- For each bullet:
  - What actually happened
  - Why it matters commercially
  - The implication

2. What This Means for Hayabusa
- Maximum 3 bullets
- Specific implications for product, channel, pricing, positioning, or geography

3. Actions
- Maximum 3 bullets
- Only actions directly justified by the signals above

STYLE:
- Direct
- Specific
- Commercially sharp
- Executive-level
- No fluff
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

    const briefing =
      data.output_text ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap(item => Array.isArray(item.content) ? item.content : [])
            .filter(contentItem => contentItem.type === "output_text" && contentItem.text)
            .map(contentItem => contentItem.text)
            .join("\n")
        : "") ||
      "No briefing generated";

    return res.status(200).json({
      ok: true,
      briefing
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || String(error)
    });
  }
}
