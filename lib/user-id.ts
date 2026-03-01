const STORAGE_KEY = 'inflation-income-user-id';
const COOKIE_NAME = 'anonymous_user_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function ensureAnonymousUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const cookieValue = readCookie(COOKIE_NAME);
  const storageValue = window.localStorage.getItem(STORAGE_KEY);
  const existing = cookieValue || storageValue;

  if (existing) {
    writeCookie(COOKIE_NAME, existing);
    window.localStorage.setItem(STORAGE_KEY, existing);
    return existing;
  }

  const generated = crypto.randomUUID();
  writeCookie(COOKIE_NAME, generated);
  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
