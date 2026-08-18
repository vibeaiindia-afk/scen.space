/* A key pasted into a model variable, and the same key read back out in an
   error the client could see. Both happen — the second one is how the first
   one was found, in a screenshot of the studio's own chat.

   modelFrom() refuses a value that looks like a credential, so a misplaced key
   falls back to the real default instead of being sent as a model name.
   redact() strips anything key-shaped out of text on its way to a caller. */

const KEYISH = /\b(?:xai-|sk-(?:ant-|proj-|live-|test-)?|gsk_|AIza|ghp_|glpat-|Bearer\s+)[A-Za-z0-9_\-]{12,}\b/g;
const LONG_TOKEN = /\b[A-Za-z0-9_\-]{40,}\b/g;

export function looksLikeSecret(value: string): boolean {
  const v = String(value || '').trim();
  if (!v) return false;
  KEYISH.lastIndex = 0;
  return KEYISH.test(v) || v.length >= 40;
}

/** The configured model, unless someone put a credential in that variable. */
export function modelFrom(envValue: string | undefined, fallback: string): string {
  const v = String(envValue || '').trim();
  if (!v) return fallback;
  return looksLikeSecret(v) ? fallback : v;
}

/** Text a caller may see, with anything key-shaped taken out of it. */
export function redact(text: unknown): string {
  return String(text ?? '')
    .replace(KEYISH, '[redacted]')
    .replace(LONG_TOKEN, m => (/^[a-z0-9.\-]+$/i.test(m) && m.includes('.') ? m : '[redacted]'));
}
