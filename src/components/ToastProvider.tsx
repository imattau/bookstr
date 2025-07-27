import React from 'react';

interface Toast {
  id: number;
  message: string;
  visible: boolean;
}

interface ToastContextValue {
  addToast: (msg: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, message, visible: true }]);
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
      <div className="fixed bottom-4 left-4 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded bg-gray-800 text-white px-4 py-2 transition-opacity duration-500 ${t.visible ? 'opacity-90' : 'opacity-0'}`}
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
