import { create } from "zustand";
import type { UserDto } from "@/lib/types/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserDto) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
}));
