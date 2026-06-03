import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshing: Promise<string | null> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, "");
  }

  async init(): Promise<void> {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  async setToken(token: string | null, refreshToken?: string): Promise<void> {
    this.token = token;
    try {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch {
      // SecureStore not available
    }
  }

  async clearToken(): Promise<void> {
    this.token = null;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // SecureStore not available
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path.startsWith("/") ? path : `/${path}`, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.clearToken();
        return null;
      }

      const data = await response.json();
      await this.setToken(data.token, data.refreshToken);
      return data.token;
    } catch {
      return null;
    }
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, params } = options;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (this.token) {
      requestHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    const url = this.buildUrl(path, params);

    try {
      let response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Token refresh on 401
      if (response.status === 401 && this.token && !this.refreshing) {
        this.refreshing = this.refreshAccessToken();
        const newToken = await this.refreshing;
        this.refreshing = null;

        if (newToken) {
          requestHeaders["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
          });
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          error: data?.message || data?.error || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      return { data: data as T, status: response.status };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  async get<T = any>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "GET", params });
  }

  async post<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "POST", body });
  }

  async put<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "PUT", body });
  }

  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(
  process.env.EXPO_PUBLIC_API_URL || "https://shopease.com"
);

// Initialize token on import
apiClient.init();
