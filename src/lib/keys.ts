import { nip19 } from 'nostr-tools';
import { schnorr } from '@noble/curves/secp256k1';
import { bytesToHex } from '@noble/hashes/utils';

export function validatePrivKey(key: string): boolean {
  return /^[0-9a-f]{64}$/i.test(key);
}

export function importKey(input: string): string | null {
  const str = input.trim();
  if (!str) return null;
  if (validatePrivKey(str)) return str.toLowerCase();
  try {
    const decoded = nip19.decode(str);
    if (decoded.type === 'nsec') {
      return bytesToHex(decoded.data as Uint8Array);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadKey(): string | null {
  const raw = localStorage.getItem('privKey');
  if (!raw) return null;
  return importKey(raw);
}

export function saveKey(hex: string): void {
  localStorage.setItem('privKey', hex);
}

export function generateKey(): string {
  return bytesToHex(schnorr.utils.randomPrivateKey());
}
