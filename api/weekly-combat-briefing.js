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
        model: "gpt-5",
        input: `
You are a commercial intelligence agent for Hayabusa Fightwear.

Produce a WEEKLY combat sports market intelligence briefing.

Focus on:
- MMA, BJJ, Boxing, Muay Thai, Wrestling
- Equipment brands (Hayabusa, Venum, Rival, etc.)
- Market signals (DTC, Amazon, wholesale, gyms, events)

Output:
- Bullet points only
- No fluff
- Commercial insights only
- Specific, non-generic insights
- 3–5 key findings

Make it sharp, executive-level, and actionable.
        `
      })
    });

    const data = await response.json();

    const briefing =
      data.output?.[0]?.content?.[0]?.text ||
      "No briefing generated";

    return res.status(200).json({
      ok: true,
      briefing
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
