/**
 * UUID generation that works on web + native without crypto polyfills.
 * Uses crypto.randomUUID where available, falls back to a v4-shaped string.
 */
export function newId(): string {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  // RFC4122 v4-ish fallback. Not cryptographically strong, but fine for IDs.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
