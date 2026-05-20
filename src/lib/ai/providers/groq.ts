import { AIProvider, ChatResult, Classification, Generation } from "../provider";

export class GroqProvider implements AIProvider {
  name = "groq";

  private getApiKey(): string | null {
    return process.env.GROQ_API_KEY || null;
  }

  async chat(messages: { role: string; content: string }[], opts?: { model?: string; temperature?: number; maxTokens?: number }): Promise<ChatResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts?.model || "llama-3.1-8b-instant",
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 512,
      }),
    });

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      model: data.model || "llama-3.1-8b-instant",
      usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined,
    };
  }

  async embed(text: string): Promise<number[]> {
    // Groq doesn't support embeddings; fall back to simple hash-based vector
    return this.simpleHashEmbed(text);
  }

  async classify(input: string, labels: string[]): Promise<Classification> {
    const result = await this.chat([
      { role: "system", content: `Classify the input into one of: ${labels.join(", ")}. Respond with just the label name.` },
      { role: "user", content: input },
    ]);
    const label = labels.find((l) => result.content.toLowerCase().includes(l.toLowerCase())) || labels[0];
    return { label, confidence: 0.8 };
  }

  async generate(prompt: string, opts?: { model?: string; temperature?: number; maxTokens?: number }): Promise<Generation> {
    const result = await this.chat([{ role: "user", content: prompt }], opts);
    return { text: result.content, model: result.model };
  }

  private simpleHashEmbed(text: string): number[] {
    const vec = new Array(16).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % 16] += text.charCodeAt(i);
    }
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map((v) => v / mag) : vec;
  }
}
