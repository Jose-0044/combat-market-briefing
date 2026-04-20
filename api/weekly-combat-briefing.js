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
        max_output_tokens: 500, // 👈 keeps it fast
        input: "Give a short weekly overview of combat sports market trends."
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
      briefing: text || "No output returned"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
