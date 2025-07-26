import React, { createContext, useContext, useState } from 'react';

interface WalletContextValue {
  connected: boolean;
  connect: () => Promise<void>;
  sendPayment: (invoice: string) => Promise<void>;
  requestInvoice: (amount: number, memo?: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);

  const connect = async () => {
    const webln = (window as any).webln;
    if (!webln || !webln.enable) return;
    try {
      await webln.enable();
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  const sendPayment = async (invoice: string) => {
    const webln = (window as any).webln;
    if (connected && webln?.sendPayment) {
      await webln.sendPayment(invoice);
    } else {
      window.open(`lightning:${invoice}`);
    }
  };

  const requestInvoice = async (amount: number, memo?: string) => {
    const webln = (window as any).webln;
    if (connected && webln?.requestInvoice) {
      const res = await webln.requestInvoice({ amount, defaultMemo: memo });
      return res?.paymentRequest ?? res?.invoice ?? (res as any)?.pr ?? null;
    }
    return null;
  };

  return (
    <WalletContext.Provider
      value={{ connected, connect, sendPayment, requestInvoice }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
