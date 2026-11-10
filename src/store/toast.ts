import { create } from "zustand";

export interface ToastItem {
  id: number;
  text: string;
  isError: boolean;
}

interface ToastStore {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}

const MAX_TOASTS = 3;

let nextId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

const show = (text: string, isError: boolean, duration = 5000) => {
  const { toasts, dismiss } = useToastStore.getState();

  // Showing the same message twice in a row only restarts nothing: keep one
  if (toasts.some((item) => item.text === text)) return;

  const id = nextId++;

  useToastStore.setState({
    toasts: [...toasts, { id, text, isError }].slice(-MAX_TOASTS),
  });

  setTimeout(() => dismiss(id), duration);
};

export const toast = {
  info: (text: string, duration?: number) => show(text, false, duration),
  error: (text: string, duration?: number) => show(text, true, duration),
};
