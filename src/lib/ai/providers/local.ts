import { AIProvider, ChatResult, Classification, Generation } from "../provider";

export class LocalProvider implements AIProvider {
  name = "local";

  async chat(messages: { role: string; content: string }[]): Promise<ChatResult> {
    const last = messages[messages.length - 1]?.content || "";
    const lower = last.toLowerCase();

    // Rule-based responses for common e-commerce queries
    let content = "I can help with shopping. What are you looking for?";

    if (lower.includes("order") || lower.includes("track")) {
      content = "You can track your orders in 'My Orders'. Would you like help with a specific order?";
    } else if (lower.includes("return") || lower.includes("refund")) {
      content = "Returns are accepted within 30 days. You can initiate a return from your order details page.";
    } else if (lower.includes("deal") || lower.includes("offer") || lower.includes("discount")) {
      content = "Check our daily deals page for the latest discounts. Flash sales at 8 PM IST!";
    } else if (lower.includes("shipping") || lower.includes("delivery")) {
      content = "Standard delivery takes 3-5 business days. Express delivery available for next-day.";
    } else if (lower.includes("recommend") || lower.includes("suggest")) {
      content = "Based on popular trends, check out our bestsellers section. What category interests you?";
    } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      content = "Hello! I'm your ShopEase AI assistant. How can I help you today?";
    }

    return { content, model: "local-rule-based" };
  }

  async embed(text: string): Promise<number[]> {
    const vec = new Array(16).fill(0);
    for (let i = 0; i < text.length; i++) vec[i % 16] += text.charCodeAt(i);
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map((v) => v / mag) : vec;
  }

  async classify(input: string, labels: string[]): Promise<Classification> {
    const lower = input.toLowerCase();
    for (const label of labels) {
      if (lower.includes(label.toLowerCase())) return { label, confidence: 0.7 };
    }
    return { label: labels[0], confidence: 0.3 };
  }

  async generate(prompt: string): Promise<Generation> {
    const result = await this.chat([{ role: "user", content: prompt }]);
    return { text: result.content, model: "local-rule-based" };
  }
}
