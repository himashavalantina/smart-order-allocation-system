"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Package, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      const store = useAuthStore.getState();
      router.push(store.user?.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30 mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="glass-card auth-glow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Email address</label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 glass-card p-4 space-y-1">
          <p className="text-slate-400 text-xs font-medium mb-2">Demo Credentials</p>
          <div className="space-y-1">
            {[
              { label: "Admin", email: "admin@orderalloc.lk", pass: "Admin@123" },
              { label: "Customer", email: "kavya@example.com", pass: "Customer@123" },
            ].map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => { setEmail(cred.email); setPassword(cred.pass); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-indigo-400 font-medium">{cred.label}:</span>{" "}
                <span className="text-xs text-slate-300">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
