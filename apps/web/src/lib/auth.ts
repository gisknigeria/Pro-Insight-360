export type UserRole = string;

interface TokenPayload {
  role?: string;
  sub?: string;
  email?: string;
}

export function getTokenPayload(): TokenPayload | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  return getTokenPayload()?.role ?? null;
}

export function isClientAdmin(): boolean {
  return getUserRole() === 'CLIENT_ADMIN';
}
