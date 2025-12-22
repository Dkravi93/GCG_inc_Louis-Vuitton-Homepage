import { atom } from 'jotai';

// Toast state atom
export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const toastAtom = atom<ToastState>({
  show: false,
  message: '',
  type: 'info',
});

// Toast actions
export const showToastAtom = atom(
  null,
  (get, set, payload: { message: string; type: 'success' | 'error' | 'info' }) => {
    set(toastAtom, {
      show: true,
      message: payload.message,
      type: payload.type,
    });

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      set(toastAtom, (prev) => ({ ...prev, show: false }));
    }, 3000);
  }
);

export const hideToastAtom = atom(
  null,
  (get, set) => {
    set(toastAtom, (prev) => ({ ...prev, show: false }));
  }
);

// Sidebar state
export const sidebarOpenAtom = atom<boolean>(false);
export const toggleSidebarAtom = atom(
  null,
  (get, set) => {
    set(sidebarOpenAtom, !get(sidebarOpenAtom));
  }
);

// Search state
export const searchOpenAtom = atom<boolean>(false);
export const toggleSearchAtom = atom(
  null,
  (get, set) => {
    set(searchOpenAtom, !get(searchOpenAtom));
  }
);

// Filter drawer state
export const filterDrawerOpenAtom = atom<boolean>(false);
export const toggleFilterDrawerAtom = atom(
  null,
  (get, set) => {
    set(filterDrawerOpenAtom, !get(filterDrawerOpenAtom));
  }
);


