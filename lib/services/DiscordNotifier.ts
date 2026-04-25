/**
 * Posts to a Discord webhook. Reads URL from EXPO_PUBLIC_DISCORD_WEBHOOK_URL.
 * Always wrapped in try/catch — never throws, never crashes the app.
 */
export async function notifyDiscord(content: string): Promise<boolean> {
  const url = process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn('[discord] no webhook configured');
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, username: 'MechMind' }),
    });
    if (!res.ok) {
      console.warn('[discord] non-2xx', res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[discord] request failed', e);
    return false;
  }
}
