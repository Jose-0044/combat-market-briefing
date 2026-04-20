export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const expected = `Bearer ${process.env.ZAPIER_SECRET}`;

  if (authHeader !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        input: "Reply with exactly: OpenAI key works."
      })
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(500).json({
        ok: false,
        step: "openai",
        error: openaiData
      });
    }

    let text = "";

    if (openaiData.output_text) {
      text = openaiData.output_text;
    } else if (Array.isArray(openaiData.output)) {
      for (const item of openaiData.output) {
        if (item.type === "message" && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (contentItem.type === "output_text" && contentItem.text) {
              text += contentItem.text;
            }
          }
        }
      }
    }

    return res.status(200).json({
      ok: true,
      step: "openai",
      message: "OpenAI request succeeded",
      text: text || "No text returned"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      step: "server",
      error: String(error)
    });
  }
}
