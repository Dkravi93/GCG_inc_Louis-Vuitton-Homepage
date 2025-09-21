import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { authTokenAtom, authUserAtom } from '../store/auth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAtomValue(authUserAtom);
  const token = useAtomValue(authTokenAtom);
  
  if (!user || !token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
