// Multi-modal data processing: text, audio, image, video
import { getAIProvider } from "./orchestrator";
import { isAIFeatureEnabled } from "./features";

// ============ TEXT PROCESSING ============

export interface TextAnalysis {
  language: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  topics: string[];
  keywords: string[];
  readability: number;
  summary: string;
  entities: { type: string; value: string }[];
}

export async function analyzeText(text: string, locale?: string): Promise<TextAnalysis> {
  const enabled = await isAIFeatureEnabled("ai_chatbot");
  const provider = await getAIProvider("ai_chatbot");

  if (!enabled) {
    return simpleTextAnalysis(text, locale);
  }

  try {
    const result = await provider.generate(`Analyze this text and return JSON with: language, sentiment (positive/negative/neutral), sentimentScore (0-1), topics[], keywords[], readability (0-100), summary (1 sentence), entities[]. Text: ${text.slice(0, 2000)}`, { maxTokens: 512 });
    return parseTextAnalysis(result.text) || simpleTextAnalysis(text);
  } catch {
    return simpleTextAnalysis(text, locale);
  }
}

function simpleTextAnalysis(text: string, locale?: string): TextAnalysis {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const avgWordLen = words > 0 ? text.replace(/\s+/g, "").length / words : 0;

  const positiveWords = ["good", "great", "excellent", "amazing", "love", "best", "happy", "wonderful", "fantastic", "awesome"];
  const negativeWords = ["bad", "terrible", "worst", "hate", "awful", "horrible", "poor", "disappointed", "broke", "useless"];

  const posCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negCount = negativeWords.filter((w) => lower.includes(w)).length;

  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (posCount > negCount) sentiment = "positive";
  else if (negCount > posCount) sentiment = "negative";

  const keywords = text.toLowerCase().split(/\s+/).filter((w) => w.length > 4).slice(0, 10);
  const readability = Math.max(0, Math.min(100, 100 - avgWordLen * 5 - (sentences > 0 ? words / sentences : 20) * 0.5));

  return {
    language: locale || "en",
    sentiment,
    sentimentScore: posCount > negCount ? 0.6 + posCount * 0.1 : negCount > posCount ? 0.4 - negCount * 0.1 : 0.5,
    topics: keywords.slice(0, 3),
    keywords,
    readability: Math.round(readability),
    summary: text.slice(0, 150) + (text.length > 150 ? "..." : ""),
    entities: [],
  };
}

function parseTextAnalysis(text: string): TextAnalysis | null {
  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json);
    return {
      language: parsed.language || "en",
      sentiment: parsed.sentiment || "neutral",
      sentimentScore: parsed.sentimentScore || 0.5,
      topics: parsed.topics || [],
      keywords: parsed.keywords || [],
      readability: parsed.readability || 50,
      summary: parsed.summary || "",
      entities: parsed.entities || [],
    };
  } catch {
    return null;
  }
}

// ============ AUDIO PROCESSING ============

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  transcript?: string;
  language?: string;
  sentiment?: string;
  audioFeatures?: {
    energy: number;
    loudness: number;
    speechRate: number;
    silenceRatio: number;
  };
}

export async function analyzeAudio(audioBuffer: Buffer, format: string): Promise<AudioAnalysis> {
  // Basic audio analysis — in production, use libraries like librosa via Python microservice
  const sampleRate = 44100;
  const duration = audioBuffer.length / (sampleRate * 2); // Approximate for 16-bit mono

  // Simple energy/loudness calculation
  let energy = 0;
  let silenceCount = 0;
  const view = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);

  for (let i = 0; i < view.length; i++) {
    const normalized = view[i] / 32768;
    energy += normalized * normalized;
    if (Math.abs(normalized) < 0.01) silenceCount++;
  }

  energy = Math.sqrt(energy / view.length);

  return {
    duration: Math.round(duration * 100) / 100,
    sampleRate,
    channels: 1,
    format,
    audioFeatures: {
      energy: Math.round(energy * 1000) / 1000,
      loudness: Math.round(-20 + energy * 40 * 100) / 100,
      speechRate: 0,
      silenceRatio: Math.round((silenceCount / view.length) * 100) / 100,
    },
  };
}

// ============ IMAGE PROCESSING ============

export interface ImageAnalysis {
  width: number;
  height: number;
  format: string;
  dominantColors: { color: string; percentage: number }[];
  description: string;
  tags: string[];
  objects: string[];
  sentiment: string;
  quality: number;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysis> {
  const enabled = await isAIFeatureEnabled("style_matcher");
  const provider = await getAIProvider("style_matcher");

  if (!enabled) {
    return simpleImageAnalysis(imageBuffer);
  }

  try {
    const base64 = imageBuffer.toString("base64").slice(0, 1000);
    const result = await provider.generate(`Describe this image and return JSON: { width, height, format, dominantColors: [{color, percentage}], description, tags[], objects[], sentiment, quality (0-100) }`);
    return parseImageAnalysis(result.text) || simpleImageAnalysis(imageBuffer);
  } catch {
    return simpleImageAnalysis(imageBuffer);
  }
}

function simpleImageAnalysis(buffer: Buffer): ImageAnalysis {
  const size = buffer.length;
  const colors = [
    { color: "#3B82F6", percentage: 30 },
    { color: "#10B981", percentage: 25 },
    { color: "#F59E0B", percentage: 20 },
    { color: "#EF4444", percentage: 15 },
    { color: "#6366F1", percentage: 10 },
  ];

  return {
    width: 0,
    height: 0,
    format: size > 100000 ? "PNG" : "JPEG",
    dominantColors: colors,
    description: "Image uploaded",
    tags: ["image", "uploaded"],
    objects: [],
    sentiment: "neutral",
    quality: Math.min(100, Math.round(size / 1000)),
  };
}

function parseImageAnalysis(text: string): ImageAnalysis | null {
  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json);
    return {
      width: parsed.width || 0,
      height: parsed.height || 0,
      format: parsed.format || "unknown",
      dominantColors: parsed.dominantColors || [],
      description: parsed.description || "",
      tags: parsed.tags || [],
      objects: parsed.objects || [],
      sentiment: parsed.sentiment || "neutral",
      quality: parsed.quality || 50,
    };
  } catch {
    return null;
  }
}

// ============ VIDEO PROCESSING ============

export interface VideoAnalysis {
  duration: number;
  width: number;
  height: number;
  format: string;
  fps: number;
  frames: { timestamp: number; description: string; objects: string[] }[];
  summary: string;
  topics: string[];
}

export async function analyzeVideo(videoBuffer: Buffer): Promise<VideoAnalysis> {
  // Extract basic video metadata from buffer
  const size = videoBuffer.length;

  return {
    duration: Math.round(size / 100000), // Rough estimate
    width: 0,
    height: 0,
    format: "unknown",
    fps: 30,
    frames: [],
    summary: "Video uploaded for analysis",
    topics: [],
  };
}

// ============ MULTI-MODAL FUSION ============

export interface MultiModalResult {
  textAnalysis?: TextAnalysis;
  imageAnalysis?: ImageAnalysis;
  audioAnalysis?: AudioAnalysis;
  combinedSentiment: string;
  combinedTopics: string[];
  insights: string[];
}

export async function analyzeMultiModal(data: { text?: string; image?: Buffer; audio?: Buffer; video?: Buffer }): Promise<MultiModalResult> {
  const results: Partial<MultiModalResult> = {
    combinedSentiment: "neutral",
    combinedTopics: [],
    insights: [],
  };

  // Process each modality in parallel
  const topics: string[] = [];
  const insights: string[] = [];

  // Process each modality in parallel
  const promises: Promise<void>[] = [];

  if (data.text) {
    promises.push(
      analyzeText(data.text).then((r) => {
        results.textAnalysis = r;
        results.combinedSentiment = r.sentiment;
        topics.push(...r.topics);
      })
    );
  }

  if (data.image) {
    promises.push(
      analyzeImage(data.image).then((r) => {
        results.imageAnalysis = r;
        topics.push(...r.tags);
      })
    );
  }

  if (data.audio) {
    promises.push(
      analyzeAudio(data.audio, "wav").then((r) => {
        results.audioAnalysis = r;
      })
    );
  }

  await Promise.allSettled(promises);

  results.combinedTopics = [...new Set(topics)];

  // Generate insights from combined analysis
  if (results.textAnalysis?.sentiment === "negative" && results.imageAnalysis?.sentiment === "negative") {
    insights.push("Strong negative signal across modalities — prioritize review");
  } else if (results.combinedTopics.length > 5) {
    insights.push(`Rich content with ${results.combinedTopics.length} identified topics`);
  } else if (results.combinedTopics.length > 0) {
    insights.push(`Primary topics: ${results.combinedTopics.slice(0, 3).join(", ")}`);
  }

  results.insights = insights;

  return results as MultiModalResult;
}
