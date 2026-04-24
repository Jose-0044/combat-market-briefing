export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = (req.headers.authorization || "").trim();
  const expected = `Bearer ${process.env.ZAPIER_SECRET || ""}`.trim();

  const normalize = (str) => String(str || "").replace(/\s+/g, " ").trim();

  if (!process.env.ZAPIER_SECRET) {
    return res.status(200).json({
      ok: true,
      briefing_text: "DIAGNOSTIC: ZAPIER_SECRET is missing in Vercel."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      ok: true,
      briefing_text: "DIAGNOSTIC: OPENAI_API_KEY is missing in Vercel."
    });
  }

  if (normalize(auth) !== normalize(expected)) {
    return res.status(200).json({
      ok: true,
      briefing_text: `DIAGNOSTIC: Auth failed.

Received:
${auth}

Expected:
${expected}`
    });
  }

  return res.status(200).json({
    ok: true,
    briefing_text: `DIAGNOSTIC SUCCESS

Zapier is reaching Vercel correctly.
Authorization is working.
Vercel environment variables are present.
The issue is likely inside the OpenAI/web-search call, not Zapier.

Next step: replace this diagnostic version with a lighter OpenAI version.`
  });
}
