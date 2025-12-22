import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { authUserAtom } from '../store/auth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAtomValue(authUserAtom);
  
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
