import { prisma } from "@/lib/prisma";

export async function isAIFeatureEnabled(feature: string): Promise<boolean> {
  const config = await prisma.aIConfig.findUnique({ where: { feature } });
  return config?.enabled ?? false;
}

export const AI_FEATURES = {
  RECOMMENDATIONS: "recommendations",
  VOICE_LEARNING: "voice_learning",
  VIDEO_RECOGNITION: "video_recognition",
  FRAUD_DETECTION: "fraud_detection",
  DYNAMIC_PRICING: "dynamic_pricing",
  CHURN_PREDICTION: "churn_prediction",
  CUSTOMER_SEGMENTATION: "customer_segmentation",
  NEXT_BEST_ACTION: "next_best_action",
  AI_CHATBOT: "ai_chatbot",
  AI_CONTENT: "ai_content",
  SEARCH_PERSONALIZATION: "search_personalization",
  DEMAND_FORECAST: "demand_forecast",
  STYLE_MATCHER: "style_matcher",
  AGENT_FRAMEWORK: "agent_framework",
} as const;

export type AIFeature = (typeof AI_FEATURES)[keyof typeof AI_FEATURES];

export const AI_FEATURES_LIST: { key: AIFeature; label: string; description: string; defaultProvider: string }[] = [
  { key: AI_FEATURES.RECOMMENDATIONS, label: "Product Recommendations", description: "Personalized product recommendations across the storefront", defaultProvider: "groq" },
  { key: AI_FEATURES.VOICE_LEARNING, label: "Voice Learning", description: "Improve voice search accuracy from user corrections", defaultProvider: "local" },
  { key: AI_FEATURES.VIDEO_RECOGNITION, label: "Video Recognition", description: "Identify products from video uploads", defaultProvider: "replicate" },
  { key: AI_FEATURES.FRAUD_DETECTION, label: "Fraud Detection", description: "Score orders and logins for fraud risk", defaultProvider: "local" },
  { key: AI_FEATURES.DYNAMIC_PRICING, label: "Dynamic Pricing", description: "AI-optimized pricing based on demand and competition", defaultProvider: "groq" },
  { key: AI_FEATURES.CHURN_PREDICTION, label: "Churn Prediction", description: "Predict and prevent customer churn", defaultProvider: "groq" },
  { key: AI_FEATURES.CUSTOMER_SEGMENTATION, label: "Customer Segmentation", description: "ML-based customer clustering and segmentation", defaultProvider: "local" },
  { key: AI_FEATURES.NEXT_BEST_ACTION, label: "Next Best Action", description: "AI-driven action recommendations per user", defaultProvider: "groq" },
  { key: AI_FEATURES.AI_CHATBOT, label: "AI Chatbot", description: "Enhanced chatbot with memory and multi-turn context", defaultProvider: "groq" },
  { key: AI_FEATURES.AI_CONTENT, label: "AI Content Generation", description: "Auto-generate product descriptions and tags", defaultProvider: "groq" },
  { key: AI_FEATURES.SEARCH_PERSONALIZATION, label: "Search Personalization", description: "Re-rank search results per user preferences", defaultProvider: "local" },
  { key: AI_FEATURES.DEMAND_FORECAST, label: "Demand Forecasting", description: "Predict inventory demand using ML", defaultProvider: "local" },
  { key: AI_FEATURES.STYLE_MATCHER, label: "Style Matcher", description: "Visual similarity search for products", defaultProvider: "replicate" },
  { key: AI_FEATURES.AGENT_FRAMEWORK, label: "Agent Framework", description: "Autonomous AI agents for business automation", defaultProvider: "groq" },
];

export async function checkAllFeatures(): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  for (const { key } of AI_FEATURES_LIST) {
    result[key] = await isAIFeatureEnabled(key);
  }
  return result;
}
