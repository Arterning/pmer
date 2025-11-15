import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  let nextId = 0;

  return {
    subscribe,
    show: (message: string, type: ToastType = 'success') => {
      const id = nextId++;
      const toast: Toast = { id, message, type };

      update(toasts => [...toasts, toast]);

      // 3秒后自动移除
      setTimeout(() => {
        update(toasts => toasts.filter(t => t.id !== id));
      }, 3000);
    },
    remove: (id: number) => {
      update(toasts => toasts.filter(t => t.id !== id));
    },
  };
}

export const toastStore = createToastStore();
