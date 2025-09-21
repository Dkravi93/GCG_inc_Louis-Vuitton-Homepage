export type StoredUser = { 
  id: string; 
  email: string; 
  firstName?: string; 
  lastName?: string; 
  role?: 'user' | 'admin' | 'superadmin';
  avatarUrl?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    locale?: string;
  }
};

const TOKEN_KEY = 'gcg_token';
const USER_KEY = 'gcg_user';

export function getToken(): string | null {
  try { 
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    return token;
  } catch { return null; }
}

export function getUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user;
  } catch { return null; }
}

export function setAuth(token: string, user: StoredUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    console.error('setAuth failed');
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    console.error('clearAuth failed');
  }
}


