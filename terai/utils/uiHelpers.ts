import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: ((toasts: ToastMessage[]) => void)[] = [];

  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(toast: Omit<ToastMessage, 'id'>) {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      duration: 5000,
      ...toast
    };

    this.toasts.push(newToast);
    this.notify();

    // Auto remove after duration
    setTimeout(() => {
      this.remove(newToast.id);
    }, newToast.duration);

    return newToast.id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  success(title: string, message?: string) {
    return this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string) {
    return this.show({ type: 'error', title, message });
  }

  warning(title: string, message?: string) {
    return this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string) {
    return this.show({ type: 'info', title, message });
  }
}

export const toast = new ToastManager();

// Error handling utilities
export const handleApiError = (error: any, defaultMessage = 'Terjadi kesalahan') => {
  console.error('API Error:', error);

  let message = defaultMessage;

  if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return message;
};

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  options: {
    onSuccess?: (result: T) => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  } = {}
): Promise<T | null> => {
  try {
    const result = await operation();

    if (options.successMessage) {
      toast.success(options.successMessage);
    }

    options.onSuccess?.(result);
    return result;
  } catch (error) {
    const errorMessage = handleApiError(error, options.errorMessage);

    toast.error('Error', errorMessage);
    options.onError?.(errorMessage);

    return null;
  }
};

// Loading state utilities
export const createLoadingState = () => {
  let loading = false;
  const listeners: ((isLoading: boolean) => void)[] = [];

  const subscribe = (listener: (isLoading: boolean) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  };

  const setLoading = (isLoading: boolean) => {
    loading = isLoading;
    listeners.forEach(listener => listener(loading));
  };

  const withLoading = async <T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, setLoading, withLoading, getLoading: () => loading };
};

// Form validation utilities
export const validateForm = <T>(
  schema: any,
  data: T
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const errors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};