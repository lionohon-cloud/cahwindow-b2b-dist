import type { Session, SessionUser } from '@/types';

const SESSION_KEY = '_b2bUser';
const EXPIRY_KEY = '_b2bExpiry';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24시간

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL!;

// ─── 로그인 ───────────────────────────────────────────────────────
export async function login(
  loginId: string,
  password: string
): Promise<SessionUser> {
  const params = new URLSearchParams({
    action: 'login',
    loginId,
    password,
    t: String(Date.now()),
  });

  const res = await fetch(`${AUTH_API_URL}?${params}`, { method: 'GET' });
  if (!res.ok) throw new Error('네트워크 오류');

  const data = await res.json();
  if (!data.success) throw new Error(data.message || '로그인 실패');

  const user: SessionUser = data.user;
  saveSession(user);
  return user;
}

// ─── 세션 저장 / 조회 / 삭제 ──────────────────────────────────────
export function saveSession(user: SessionUser): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  const expiry = sessionStorage.getItem(EXPIRY_KEY);
  if (!raw || !expiry) return null;
  if (Date.now() > Number(expiry)) {
    clearSession();
    return null;
  }
  return { user: JSON.parse(raw) as SessionUser, expiry: Number(expiry) };
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
}

export function requireSession(): SessionUser {
  const s = getSession();
  if (!s) throw new Error('UNAUTHORIZED');
  return s.user;
}
