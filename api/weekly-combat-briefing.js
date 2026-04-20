export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization;
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
        model: "gpt-5",
        tools: [{ type: "web_search_preview" }],
        input: `
You are a combat sports industry analyst.

Create a WEEKLY EXECUTIVE BRIEFING covering:
- MMA, Boxing, BJJ, Wrestling
- Equipment brands (Hayabusa, Venum, Everlast, Rival, etc.)
- Events (UFC, ONE, PFL, major boxing cards)
- Retail & eCommerce trends (Amazon, DTC, wholesale)
- Geographic insights (US, UK, Brazil, Middle East, Asia)

Structure:

1. KEY HEADLINES (5 bullets)
2. MARKET MOVEMENTS (brands, partnerships, distribution)
3. EVENT & ATHLETE MOMENTUM
4. RETAIL / ECOM SIGNALS
5. STRATEGIC TAKEAWAYS (for a premium combat brand)

Tone:
- Executive
- Concise
- Commercially focused
- No fluff
        `
      })
    });

    const data = await response.json();

    let text = "";

    if (data.output) {
      for (const item of data.output) {
        if (item.type === "message") {
          for (const c of item.content) {
            if (c.type === "output_text") {
              text += c.text;
            }
          }
        }
      }
    }

    return res.status(200).json({
      ok: true,
      briefing: text
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
