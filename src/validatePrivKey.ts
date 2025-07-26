export function validatePrivKey(key: string): boolean {
  return /^[0-9a-f]{64}$/i.test(key);
}
