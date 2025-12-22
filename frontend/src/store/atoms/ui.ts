import { atom } from 'jotai';

export const sidebarOpenAtom = atom(false);
export const searchOpenAtom = atom(false);
export const filterDrawerOpenAtom = atom(false);

interface Toast {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const toastAtom = atom<Toast>({
    show: false,
    message: '',
    type: 'info',
});
