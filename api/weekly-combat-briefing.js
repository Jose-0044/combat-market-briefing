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
- MMA
- BJJ
- Boxing
- Muay Thai
- Wrestling
- Equipment brands
- Market signals across DTC, Amazon, wholesale, gyms, and events

Output requirements:
- Bullet points only
- No fluff
- Specific, non-generic insights
- Commercially relevant only
- 3 to 5 key findings
- Write like a sharp operator briefing a CEO
        `
      })
    });

    const data = await response.json();

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
