import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth } from "@/lib/firebase/config";
import { signInWithCustomToken, signOut } from "firebase/auth";

interface User {
  id: string;
  name: string;
  role: "user" | "admin";
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true, // Start as true to prevent flash redirects

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),

      register: async (name: string, pin: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, pin }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Registration failed");
          }

          set({ isLoading: false });
          return { success: true };
        } catch (error: unknown) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Registration failed";
          return { success: false, error: message };
        }
      },

      login: async (name: string, pin: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, pin }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Login failed");
          }

          const userCredential = await signInWithCustomToken(auth, data.customToken);
          const idToken = await userCredential.user.getIdToken();

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          set({ user: data.user, isLoading: false });
          return { success: true };
        } catch (error: unknown) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Login failed";
          return { success: false, error: message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await signOut(auth);
          await fetch("/api/auth/session", { method: "DELETE" });
          set({ user: null, isLoading: false });
        } catch (error: unknown) {
          console.error("Logout error:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "stride-auth-storage",
      // Only persist the user, let isLoading reset on mount
      partialize: (state) => ({ user: state.user }),
    }
  )
);
