"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Package, Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from "lucide-react";

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

      let redirectPath = "/dashboard";
      if (store.user?.role === "ADMIN") {
        redirectPath = "/admin";
      } else if (store.user?.role === "BRANCH_MANAGER") {
        redirectPath = "/branch-dashboard";
      }

      router.push(redirectPath);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[#080b18]">
      {/* Background Depth & Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradients */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />

        {/* Floating 3D Geometric Shapes (CSS simulated) */}
        <div className="absolute top-[15%] left-[20%] w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-900/40 border border-white/5 backdrop-blur-md rotate-12 animate-[spin_20s_linear_infinite]" />
        <div className="absolute bottom-[20%] right-[15%] w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500/20 to-purple-900/40 border border-white/5 backdrop-blur-md -rotate-12 animate-[bounce_8s_infinite]" />
        <div className="absolute top-[40%] right-[25%] w-16 h-16 rounded-lg bg-gradient-to-bl from-blue-500/20 to-cyan-900/40 border border-white/5 backdrop-blur-md rotate-45 animate-[spin_15s_linear_infinite_reverse]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-600 shadow-xl shadow-emerald-500/30 mb-5 relative group">
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Package className="w-8 h-8 text-white relative z-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  id="email"
                  type="email"
                  className="input-base !pl-12 h-11 bg-slate-900/50 border-white/10 focus:bg-slate-900/80 transition-all duration-300 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  placeholder="   you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</label>
                <Link href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className="input-base !pl-12 pr-10 h-11 bg-slate-900/50 border-white/10 focus:bg-slate-900/80 transition-all duration-300 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  placeholder="   ••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500"
              />
              <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2 relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </span>
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Or continue with</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-sm text-slate-300 font-medium">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
              GitHub
            </button>
            <button type="button" className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-sm text-slate-300 font-medium">
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Google
            </button>
          </div>


          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
