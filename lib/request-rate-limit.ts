type WindowEntry = { count: number; resetAt: number };

const windows = new Map<string, WindowEntry>();

export function getClientIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('true-client-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'local';
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    const entry = { count: 1, resetAt: now + windowMs };
    windows.set(key, entry);
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: entry.resetAt };
  }
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;

  if (windows.size > 10_000) {
    for (const [entryKey, entry] of windows) {
      if (entry.resetAt <= now) windows.delete(entryKey);
    }
  }
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}
