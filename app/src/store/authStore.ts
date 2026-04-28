import { create } from "zustand";
import type { User } from "firebase/auth";

import { signOut as signOutFromService } from "../services/auth";
import type { UserProfile } from "../types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (value: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: async () => {
    await signOutFromService();
    set({ user: null, profile: null, isLoading: false });
  },
}));
