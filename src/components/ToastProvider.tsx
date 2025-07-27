import React from 'react';

interface Toast {
  id: number;
  message: string;
  visible: boolean;
  type: 'success' | 'error';
}

interface ToastContextValue {
  addToast: (msg: string, opts?: { type?: 'success' | 'error' }) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, opts?: { type?: 'success' | 'error' }) => {
    const id = Date.now() + Math.random();
    const type = opts?.type ?? 'success';
    setToasts((ts) => [...ts, { id, message, visible: true, type }]);
    setTimeout(() => {
      setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    }, 2500);
    setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
        <div className="fixed bottom-[var(--space-4)] left-[var(--space-4)] space-y-2 pointer-events-none">
        {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-card px-[var(--space-4)] py-[var(--space-2)] transition-opacity duration-500 ${
                t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
              } ${t.visible ? 'opacity-90' : 'opacity-0'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.addToast;
}
