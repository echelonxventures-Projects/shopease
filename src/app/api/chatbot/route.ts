import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, productId } = body;
    const lastMessage = messages[messages.length - 1]?.content || "";
    const userId = body.userId;

    // Load AI config for chatbot from DB
    const chatbotConfig = await prisma.aIConfig.findUnique({ where: { feature: "ai_chatbot" } });
    const isEnabled = chatbotConfig?.enabled ?? false;
    const provider = chatbotConfig?.provider || "pattern";
    const config = (chatbotConfig?.config as any) || {};

    const systemPrompt = {
      role: "system",
      content: `You are ShopEase, a helpful e-commerce shopping assistant. Help customers with:
- Product recommendations and comparisons
- Order tracking and status
- Returns and refunds
- Shipping and delivery information
- Current deals and discounts
- Account questions
Keep responses concise (2-3 sentences max). Be friendly and helpful.`
    };

    const apiMessages = [systemPrompt, ...messages.map((m: any) => ({ role: m.role, content: m.content }))];

    // Priority 1: Hugging Face Inference API (free tier)
    if ((provider === "huggingface" || provider === "hf") && config.apiKey) {
      const result = await callHuggingFace(config.apiKey, config.model || "mistralai/Mistral-7B-Instruct-v0.2", lastMessage);
      if (result) {
        if (userId) await saveMessage(userId, messages, result);
        return NextResponse.json({ reply: result, source: "huggingface" });
      }
    }

    // Priority 2: Groq Inference API (free tier)
    if ((provider === "groq") && config.apiKey) {
      const result = await callGroq(config.apiKey, config.model || "llama-3.1-8b-instant", apiMessages);
      if (result) {
        if (userId) await saveMessage(userId, messages, result);
        return NextResponse.json({ reply: result, source: "groq" });
      }
    }

    // Priority 3: OpenAI
    if ((provider === "openai") && config.apiKey) {
      const result = await callOpenAI(config.apiKey, apiMessages, config.model || "gpt-4o-mini");
      if (result) {
        if (userId) await saveMessage(userId, messages, result);
        return NextResponse.json({ reply: result, source: "openai" });
      }
    }

    // Priority 4: Context-aware pattern matching (no config needed)
    const lower = lastMessage.toLowerCase();
    let reply = "";

    if (/^(hi|hello|hey|howdy|greetings)/.test(lower)) {
      reply = "Hello! Welcome to ShopEase. I can help you find products, track orders, or answer questions about shipping and returns. What can I help with?";
    } else if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("what should i buy")) {
      reply = "Based on our trending items, check out our bestsellers in Electronics and Fashion! Want me to narrow it down by category or budget?";
    } else if (lower.includes("product") || lower.includes("item") || lower.includes("search for")) {
      reply = `I found some matches for "${lastMessage}". Our search page has filters for price, brand, and ratings. Want me to help narrow down the options?`;
    } else if (productId && (lower.includes("spec") || lower.includes("detail") || lower.includes("feature"))) {
      reply = "This product has detailed specs on its page. Want to know about shipping, return policy, or similar products?";
    } else if (lower.includes("order") && (lower.includes("track") || lower.includes("status") || lower.includes("where"))) {
      reply = "Track your order in My Orders section. Enter your order ID to get real-time updates. Need help finding it?";
    } else if (lower.includes("return") || lower.includes("refund") || lower.includes("exchange")) {
      reply = "We accept returns within 30 days of delivery. Items must be unused with original tags. Initiate a return from your order details page — it takes just 2 clicks!";
    } else if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("how long")) {
      reply = "Standard delivery: 3-5 business days (free over ₹499). Express: next-day delivery for ₹99. Prime members get free express shipping on all orders!";
    } else if (lower.includes("deal") || lower.includes("offer") || lower.includes("discount") || lower.includes("coupon") || lower.includes("promo")) {
      reply = "Check our Deals page for daily discounts up to 70% off! Flash sales happen every evening at 8 PM IST. Use code SAVE10 for an extra 10% off your first order.";
    } else if (lower.includes("payment") || lower.includes("pay") || lower.includes("cod") || lower.includes("upi")) {
      reply = "We accept Credit/Debit Cards, UPI, NetBanking, Wallets, BNPL (Simpl, Zest), Cash on Delivery, and No-Cost EMI! Which payment method works best?";
    } else if (lower.includes("cancel")) {
      reply = "You can cancel your order before it ships from the Order Details page. Once shipped, you can return it within 30 days instead.";
    } else if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
      reply = "Check the product page for the latest price. We also offer price protection — if the price drops within 7 days of purchase, we'll refund the difference!";
    } else if (lower.includes("compare") || lower.includes("vs") || lower.includes("better")) {
      reply = "Great question! Want to compare specific products? Share the product names or links and I'll help you weigh the options.";
    } else if (lower.includes("prime")) {
      reply = "ShopEase Prime gives you free express shipping, exclusive deals, early access to sales, and more! Start your free trial from the Prime page.";
    } else if (lower.includes("help") || lower.includes("support") || lower.includes("contact")) {
      reply = "I'm here to help! For complex issues, use our Live Chat (top right) or email support@shopease.com. We typically respond within 2 hours.";
    } else if (lower.includes("warranty") || lower.includes("guarantee") || lower.includes("genuine")) {
      reply = "All our products are 100% genuine with manufacturer warranty. Electronics typically come with 1-year warranty. Check the product page for specifics.";
    } else if (lower.includes("change") || lower.includes("modify") || lower.includes("update")) {
      reply = "You can update your address or payment method before shipping. Go to My Orders > Select Order > Modify. After shipping, only address changes are limited.";
    } else if (productId) {
      reply = `I can help with "${lastMessage}"! Ask about specs, shipping, return policy, or similar products. What would you like to know?`;
    } else {
      reply = "I'm your ShopEase assistant! Ask me about products, orders, shipping, returns, deals, or payments. I'm here to help you shop smarter.";
    }

    if (userId) await saveMessage(userId, messages, reply);
    return NextResponse.json({ reply, source: "pattern" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function callHuggingFace(apiKey: string, model: string, message: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: message,
        parameters: { max_new_tokens: 256, return_full_text: false, temperature: 0.7 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.generated_text || data.generated_text || null;
  } catch {
    return null;
  }
}

async function callGroq(apiKey: string, model: string, messages: any[]): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens: 256 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function callOpenAI(apiKey: string, messages: any[], model: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens: 256 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function saveMessage(userId: string, historyMessages: any[], reply: string) {
  try {
    let session = await prisma.chatbotSession.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
    });

    const allMessages = [
      ...historyMessages.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "assistant", content: reply },
    ];

    if (session) {
      const existingMessages = (session.messages as any[]) || [];
      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: { messages: [...existingMessages, ...allMessages] },
      });
    } else {
      await prisma.chatbotSession.create({
        data: { userId, messages: allMessages },
      });
    }
  } catch (err) {
    console.error("Chatbot session save error:", err);
  }
}
