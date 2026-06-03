import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "@/api/client";
import { login as apiLogin, register as apiRegister } from "@/api/endpoints";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const USER_KEY = "auth_user";

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const res = await apiLogin(email, password);
      if ("error" in res) return false;

      const { user, token } = res;
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      await apiClient.setToken(token);
      set({ user, token, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },

  register: async (data) => {
    try {
      const res = await apiRegister(data);
      if ("error" in res) return false;

      const { user, token } = res;
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      await apiClient.setToken(token);
      set({ user, token, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
      await apiClient.clearToken();
    } catch {
      // Silent failure
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
