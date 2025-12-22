import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'admin' | 'superadmin';
    avatarUrl?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        locale?: string;
    };
}

// Persist token in localStorage
export const tokenAtom = atomWithStorage<string | null>('token', null);

// User state (can be derived or separate, often good to keep in sync with token presence)
export const userAtom = atom<User | null>(null);

export const isAuthenticatedAtom = atom((get) => !!get(tokenAtom));
