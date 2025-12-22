import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSetAtom } from "jotai";
import { setAuthAtom } from "../store/auth";
import { apiUtils, AuthResponse } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useSetAtom(setAuthAtom);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiUtils.post<AuthResponse>('/auth/login', { email, password });
      setAuth({ user: response.user });
      navigate("/");
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const buttonClassName = `rounded-full bg-black px-6 py-3 text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="mb-6 text-3xl font-medium">Sign in</h1>
      <div className="grid gap-4">
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Email" type="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Password" type="password" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button 
          onClick={onSubmit} 
          type="button" 
          className={buttonClassName}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
      <p className="mt-4 text-sm text-neutral-600">
        New here? <Link to="/register" className="underline">Create an account</Link>
      </p>
    </main>
  );
}


