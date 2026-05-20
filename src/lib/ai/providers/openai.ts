import { AIProvider, ChatResult, Classification, Generation } from "../provider";

export class OpenAIProvider implements AIProvider {
  name = "openai";

  private getApiKey(): string | null {
    return process.env.OPENAI_API_KEY || null;
  }

  async chat(messages: { role: string; content: string }[], opts?: { model?: string; temperature?: number; maxTokens?: number }): Promise<ChatResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts?.model || "gpt-4o-mini",
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 512,
      }),
    });

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      model: data.model || "gpt-4o-mini",
      usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined,
    };
  }

  async embed(text: string): Promise<number[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
    });

    const data = await res.json();
    return data.data?.[0]?.embedding || [];
  }

  async classify(input: string, labels: string[]): Promise<Classification> {
    const result = await this.chat([
      { role: "system", content: `Classify into one of: ${labels.join(", ")}. Output only the label.` },
      { role: "user", content: input },
    ]);
    const label = labels.find((l) => result.content.toLowerCase().includes(l.toLowerCase())) || labels[0];
    return { label, confidence: 0.85 };
  }

  async generate(prompt: string, opts?: { model?: string; temperature?: number; maxTokens?: number }): Promise<Generation> {
    const result = await this.chat([{ role: "user", content: prompt }], opts);
    return { text: result.content, model: result.model };
  }
}
