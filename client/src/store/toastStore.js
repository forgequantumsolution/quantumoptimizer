import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, severity = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now(), message, severity }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
