import { atom } from 'jotai';

export type UserRole = 'user' | 'admin' | 'superadmin';
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  avatarUrl?: string;
  createdAt?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    locale?: string
  }
}

export const authUserAtom = atom<AuthUser | null>(null);
export const authLoadingAtom = atom<boolean>(true); // Add loading state

export const setAuthAtom = atom(null, (_get, set, payload: { user: AuthUser }) => {
  set(authUserAtom, payload.user);
});

export const clearAuthAtom = atom(null, (_get, set) => {
  set(authUserAtom, null);
});
