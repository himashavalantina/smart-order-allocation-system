"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Package, Eye, EyeOff, Loader2, AlertCircle, MapPin } from "lucide-react";
import { CITIES } from "@/lib/types";

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    location_city: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuthStore();
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const coords = form.location_city ? CITIES[form.location_city] : null;

    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        location_city: form.location_city || undefined,
        location_lat: coords?.lat,
        location_lng: coords?.lng,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30 mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 text-sm mt-1">Join the platform today</p>
        </div>

        <div className="glass-card auth-glow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Full Name</label>
              <input
                id="full_name"
                type="text"
                className="input-base"
                placeholder="Your full name"
                value={form.full_name}
                onChange={set("full_name")}
                required
                minLength={2}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Email address</label>
              <input
                id="reg_email"
                type="email"
                className="input-base"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Password</label>
              <div className="relative">
                <input
                  id="reg_password"
                  type={showPass ? "text" : "password"}
                  className="input-base pr-10"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={8}
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

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-indigo-400" />
                Your City
                <span className="text-slate-600">(for order allocation)</span>
              </label>
              <select
                id="location_city"
                className="input-base"
                value={form.location_city}
                onChange={set("location_city")}
              >
                <option value="">Select city (optional)</option>
                {Object.keys(CITIES).map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
