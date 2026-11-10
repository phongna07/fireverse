import { User } from "firebase/auth";
import { create } from "zustand";

interface StoreType {
  currentUser: undefined | null | User;
  setCurrentUser: (user: User | null) => void;
}

export const useStore = create<StoreType>((set) => ({
  currentUser: undefined,
  setCurrentUser: (user) => set({ currentUser: user }),
}));
