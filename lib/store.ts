import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  profile: any;
  setToken: (token: string) => void;
  setProfile: (profile: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      setToken: (token) => {
        if (typeof window !== "undefined") localStorage.setItem("srmx_token", token);
        set({ token });
      },
      setProfile: (profile) => set({ profile }),
      logout: () => {
        if (typeof window !== "undefined") localStorage.removeItem("srmx_token");
        set({ token: null, profile: null });
      },
    }),
    {
      name: "srmx-auth",
      // Only persist token and profile, not functions
      partialize: (state) => ({ token: state.token, profile: state.profile }),
    }
  )
);
