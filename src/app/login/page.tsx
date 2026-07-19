"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Login failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <div>
            <p className="font-bold leading-tight">Eko Telehealth</p>
            <p className="text-xs tracking-[0.2em] text-accent font-medium">ADMIN</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/5 p-7 space-y-4"
        >
          <div>
            <h1 className="text-lg font-bold">Sign in</h1>
            <p className="text-sm text-foreground/50 mt-1">Administrator access only.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="admin@ekotelehealth.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent text-white font-semibold py-2.5 text-sm shadow-lg shadow-accent/30 transition-opacity disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
