export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResult {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface Classification {
  label: string;
  confidence: number;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Generation {
  text: string;
  model: string;
}

export interface AIProvider {
  name: string;
  chat(messages: { role: string; content: string }[], opts?: ChatOptions): Promise<ChatResult>;
  embed(text: string): Promise<number[]>;
  classify(input: string, labels: string[]): Promise<Classification>;
  generate(prompt: string, opts?: GenerateOptions): Promise<Generation>;
}

export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: AIProvider | null = null;

  register(name: string, provider: AIProvider) {
    this.providers.set(name, provider);
  }

  get(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  getDefault(): AIProvider | null {
    return this.defaultProvider;
  }

  setDefault(name: string) {
    this.defaultProvider = this.providers.get(name) || null;
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const registry = new ProviderRegistry();
