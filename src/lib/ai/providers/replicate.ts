import { AIProvider, ChatResult, Classification, Generation } from "../provider";

export class ReplicateProvider implements AIProvider {
  name = "replicate";

  private getApiKey(): string | null {
    return process.env.REPLICATE_API_KEY || null;
  }

  private defaultChatModel(): string {
    return "meta/llama-3-70b-instruct";
  }

  async chat(messages: { role: string; content: string }[], opts?: { model?: string; temperature?: number; maxTokens?: number }): Promise<ChatResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("REPLICATE_API_KEY not configured");

    const model = opts?.model || this.defaultChatModel();
    const systemMsg = messages.find((m) => m.role === "system")?.content || "";
    const userMsg = messages.filter((m) => m.role !== "system").map((m) => `${m.role}: ${m.content}`).join("\n");

    const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { prompt: `${systemMsg}\n\n${userMsg}`, max_new_tokens: opts?.maxTokens ?? 512, temperature: opts?.temperature ?? 0.7 },
      }),
    });

    const data = await res.json();
    const predictionUrl = data.urls?.get;

    if (predictionUrl) {
      // Poll for result
      let result = data;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const statusRes = await fetch(predictionUrl, { headers: { Authorization: `Token ${apiKey}` } });
        result = await statusRes.json();
        if (result.status === "succeeded") break;
        if (result.status === "failed") throw new Error("Replicate prediction failed");
      }
      const output = Array.isArray(result.output) ? result.output.join("") : String(result.output);
      return { content: output, model };
    }

    throw new Error("No prediction URL returned");
  }

  async embed(text: string): Promise<number[]> {
    // Replicate doesn't have a simple embed endpoint; return simple hash
    return this.simpleHashEmbed(text);
  }

  async classify(input: string, labels: string[]): Promise<Classification> {
    const result = await this.chat([
      { role: "system", content: `Classify into one of: ${labels.join(", ")}. Output only the label.` },
      { role: "user", content: input },
    ]);
    const label = labels.find((l) => result.content.toLowerCase().includes(l.toLowerCase())) || labels[0];
    return { label, confidence: 0.8 };
  }

  async generate(prompt: string, opts?: { model?: string; temperature?: number; maxTokens?: number }): Promise<Generation> {
    const result = await this.chat([{ role: "user", content: prompt }], opts);
    return { text: result.content, model: opts?.model || this.defaultChatModel() };
  }

  private simpleHashEmbed(text: string): number[] {
    const vec = new Array(16).fill(0);
    for (let i = 0; i < text.length; i++) vec[i % 16] += text.charCodeAt(i);
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map((v) => v / mag) : vec;
  }
}
