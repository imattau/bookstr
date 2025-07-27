import React from 'react';
import { useNostr, connectNostrWallet, nostrLogin, getPrivKey } from '../nostr';
import { usePaymentSettings } from '../usePaymentSettings';

const PaymentSettingsPage: React.FC = () => {
  const ctx = useNostr();
  const { nip07, login } = ctx;
  const minZap = usePaymentSettings((s) => s.minZap);
  const maxZap = usePaymentSettings((s) => s.maxZap);
  const address = usePaymentSettings((s) => s.address);
  const auto = usePaymentSettings((s) => s.autoPayThreshold);
  const setMinZap = usePaymentSettings((s) => s.setMinZap);
  const setMaxZap = usePaymentSettings((s) => s.setMaxZap);
  const setAddress = usePaymentSettings((s) => s.setAddress);
  const setAuto = usePaymentSettings((s) => s.setAutoPayThreshold);

  const handleSwitch = async () => {
    if (nip07) {
      const input = prompt('Enter your private key for Nostr Connect');
      if (!input) return;
      try {
        login(input);
      } catch {
        alert('Invalid key');
      }
    } else {
      const pk = await connectNostrWallet();
      if (!pk) {
        alert('No NIP-07 wallet found');
        return;
      }
      try {
        await nostrLogin(ctx, pk);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleExport = () => {
    const priv = getPrivKey();
    if (!priv) {
      alert('No private key stored');
      return;
    }
    alert(
      'Your private key. Keep it secret! Anyone with this key can publish as you:\n' +
        priv,
    );
  };

  const handleImport = () => {
    const input = prompt('Paste your private key');
    if (!input) return;
    try {
      login(input);
    } catch {
      alert('Invalid key');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm">Current signer: {nip07 ? 'NIP-07' : 'Nostr Connect'}</p>
        <button onClick={handleSwitch} className="rounded border px-3 py-1">
          Switch
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-red-600">
          Never share your private key. Export only to a secure location.
        </p>
        <div className="flex gap-2">
          <button onClick={handleExport} className="rounded border px-3 py-1">
            Export Key
          </button>
          <button onClick={handleImport} className="rounded border px-3 py-1">
            Import Key
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium">Minimum zap (sats)</label>
          <input
            type="number"
            min={1}
            value={minZap}
            onChange={(e) => setMinZap(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Maximum zap (sats)</label>
          <input
            type="number"
            min={minZap}
            value={maxZap}
            onChange={(e) =>
              setMaxZap(Math.max(minZap, parseInt(e.target.value, 10) || minZap))
            }
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Lightning address override</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Auto-accept invoices below (sats)
          </label>
          <input
            type="number"
            min={0}
            value={auto}
            onChange={(e) => setAuto(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded border p-2"
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsPage;
