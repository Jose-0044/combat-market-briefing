import { webSearchTool, Agent, Runner } from "@openai/agents";

export default async function handler(req: any, res: any) {
  try {
    // 🔐 Auth check
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${process.env.ZAPIER_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🌐 Web search tool
    const webSearchPreview = webSearchTool({
      searchContextSize: "medium"
    });

    // 🤖 Research agent
    const researchAgent = new Agent({
      name: "Combat Research",
      instructions: `Find the most commercially relevant combat sports developments in the last 7 days. Focus on brands, demand signals, distribution, and events. Avoid generic summaries.`,
      model: "gpt-5-mini",
      tools: [webSearchPreview]
    });

    // 🧠 Strategy agent
    const strategyAgent = new Agent({
      name: "Strategy Briefing",
      instructions: `Turn the research into a sharp weekly executive briefing for a premium combat sports brand scaling from $20M to $80M. Be specific, commercial, and actionable.`,
      model: "gpt-5"
    });

    const runner = new Runner();

    // Step 1: Research
    const research = await runner.run(researchAgent, [
      { role: "user", content: [{ type: "input_text", text: "Run weekly combat market scan" }] }
    ]);

    // Step 2: Strategy
    const final = await runner.run(strategyAgent, [
      { role: "user", content: [{ type: "input_text", text: research.finalOutput || "" }] }
    ]);

    return res.status(200).json({
      ok: true,
      briefing: final.finalOutput
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      error: "Server error",
      detail: error.message
    });
  }
}
