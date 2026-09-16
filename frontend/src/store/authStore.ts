"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";
import api from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    location_lat?: number;
    location_lng?: number;
    location_city?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("access_token", data.access_token);
        set({ user: data, isAuthenticated: true });
      },

      register: async (formData) => {
        const { data } = await api.post("/auth/register", formData);
        localStorage.setItem("access_token", data.access_token);
        set({ user: data, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {}
        localStorage.removeItem("access_token");
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
