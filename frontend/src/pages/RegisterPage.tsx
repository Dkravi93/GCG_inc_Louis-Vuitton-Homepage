import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authApi } from "../lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    try {
      await authApi.register({ email, password, firstName, lastName });
      navigate("/");
    } catch {
      setError("Registration failed");
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="mb-6 text-3xl font-medium">Create account</h1>
      <div className="grid gap-4">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="First name" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Last name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Email" type="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2" placeholder="Password" type="password" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button onClick={onSubmit} type="button" className="rounded-full bg-black px-6 py-3 text-white">Create account</button>
      </div>
      <p className="mt-4 text-sm text-neutral-600">
        Already have an account? <Link to="/login" className="underline">Sign in</Link>
      </p>
    </main>
  );
}


