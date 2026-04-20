export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const expected = `Bearer ${process.env.ZAPIER_SECRET}`;

  if (authHeader !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const systemPrompt =
    process.env.AGENT_SYSTEM_PROMPT ||
    `You are an industry analyst supporting Hayabusa Fightwear.

Prepare a weekly executive market overview focused on:
- boxing
- MMA
- BJJ
- wrestling
- combat fitness
- combat apparel and equipment

Prioritize:
- competitor activity
- retailer and distributor developments
- partnerships, sponsorships, and athlete signings
- product launches and innovation
- e-commerce and marketplace signals
- implications for Hayabusa

Write like a smart operator briefing the CEO.
Be concise, specific, and commercial.
No fluff.`;

  const userPrompt = `Prepare the weekly combat sector and market overview for Hayabusa leadership.

Date of briefing: ${todayStr}

Research the latest relevant developments and write a concise executive email covering:
- boxing
- MMA
- BJJ
- wrestling
- combat fitness
- combat equipment and apparel market activity
- competitor and brand activity
- retailer, distributor, and marketplace developments
- product launches, partnerships, sponsorships, and athlete signings
- consumer and demand signals
- what matters most for Hayabusa

Format:
Subject: Weekly Combat Market Overview

Executive Summary:
2-3 sentences

Key Developments:
5-7 bullet points

Implications for Hayabusa:
3 bullet points`;

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        tools: [{ type: "web_search" }],
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }]
          }
        ]
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(500).json({
        error: "OpenAI request failed",
        details: data
      });
    }

    let emailText = "";

    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === "message" && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (contentItem.type === "output_text" && contentItem.text) {
              emailText += contentItem.text + "\n";
            }
          }
        }
      }
    }

    if (!emailText.trim() && data.output_text) {
      emailText = data.output_text;
    }

    if (!emailText.trim()) {
      emailText = "No text returned from OpenAI.";
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [process.env.EMAIL_TO],
        subject: `Weekly Combat Market Overview — ${todayStr}`,
        text: emailText
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return res.status(500).json({
        error: "Email send failed",
        details: resendData,
        email_preview: emailText
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Weekly briefing generated and emailed."
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unhandled server error",
      details: String(error)
    });
  }
}
