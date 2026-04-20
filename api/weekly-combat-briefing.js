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
        max_output_tokens: 900,
        input: `
You are a senior strategy analyst for a premium combat sports brand.

Produce a WEEKLY COMBAT MARKET INTELLIGENCE BRIEFING.

Include:
1. KEY HEADLINES
2. COMPETITOR MOVES
3. EVENT MOMENTUM
4. RETAIL & ECOM SIGNALS
5. GEOGRAPHIC INSIGHTS
6. STRATEGIC TAKEAWAYS

Focus on:
- MMA
- Boxing
- BJJ / grappling
- wrestling
- combat equipment and apparel
- Hayabusa, Venum, Everlast, Rival, and other relevant brands
- UFC, major boxing events, and meaningful combat sports developments

Tone:
- executive
- commercially focused
- concise
- no fluff
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        step: "openai",
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
      "No output returned";

    return res.status(200).json({
      ok: true,
      briefing
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      step: "server",
      error: err.message || String(err)
    });
  }
}
