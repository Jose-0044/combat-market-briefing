export default async function handler(req: any, res: any) {
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
        input: "Give me a sharp, non-generic weekly combat sports market briefing focused on commercial signals."
      })
    });

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      briefing: data.output[0].content[0].text
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
