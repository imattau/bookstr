import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaymentSettingsState {
  minZap: number;
  maxZap: number;
  address: string;
  autoPayThreshold: number;
  setMinZap: (n: number) => void;
  setMaxZap: (n: number) => void;
  setAddress: (a: string) => void;
  setAutoPayThreshold: (n: number) => void;
  hydrate: (data: Partial<Pick<PaymentSettingsState, 'minZap' | 'maxZap' | 'address' | 'autoPayThreshold'>>) => void;
}

export const usePaymentSettings = create<PaymentSettingsState>()(
  persist(
    (set) => ({
      minZap: 1,
      maxZap: 1000,
      address: '',
      autoPayThreshold: 0,
      setMinZap: (minZap) => set({ minZap }),
      setMaxZap: (maxZap) => set({ maxZap }),
      setAddress: (address) => set({ address }),
      setAutoPayThreshold: (autoPayThreshold) => set({ autoPayThreshold }),
      hydrate: (data) => set(data),
    }),
    { name: 'payment-settings' },
  ),
);
