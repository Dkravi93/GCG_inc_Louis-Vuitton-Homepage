import { atom } from 'jotai';
import { clearAuth, getToken, getUser, setAuth } from '../lib/authStorage';

export type UserRole = 'user' | 'admin' | 'superadmin';
export interface AuthUser { 
  id: string; 
  email: string; 
  firstName?: string; 
  lastName?: string; 
  role?: UserRole; 
  avatarUrl?: string; 
  token?: string;
  preferences?: { 
    theme?: 'light' | 'dark' | 'system'; 
    locale?: string 
  } 
}

const initialToken = getToken();
const initialUser = getUser();

export const authTokenAtom = atom<string | null>(initialToken);
export const authUserAtom = atom<AuthUser | null>(initialUser);

export const setAuthAtom = atom(null, (_get, set, payload: { token: string; user: AuthUser }) => {
  set(authTokenAtom, payload.token);
  set(authUserAtom, payload.user);
  setAuth(payload.token, payload.user);
});

export const clearAuthAtom = atom(null, (_get, set) => {
  set(authTokenAtom, null);
  set(authUserAtom, null);
  clearAuth();
});
