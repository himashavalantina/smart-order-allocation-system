"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Package, Eye, EyeOff, Loader2, AlertCircle, MapPin, Phone, Home } from "lucide-react";
import PostalCodeAutocomplete, { PostalCodeResult } from "@/components/PostalCodeAutocomplete";


export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    mobile_number: "",
    address_line_1: "",
    address_line_2: "",
    postal_code: "",
  });

  // Resolved location from autocomplete selection
  const [locationData, setLocationData] = useState<PostalCodeResult | null>(null);

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuthStore();
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationData) {
      setError("Please select a valid postal code from the suggestions.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        mobile_number: form.mobile_number,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2 || undefined,
        postal_code: locationData.postal_code,
        location_city: locationData.city,
        location_district: locationData.district,
        location_lat: locationData.lat,
        location_lng: locationData.lng,
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
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-600 shadow-xl shadow-emerald-500/30 mb-3">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Order Allocation System · Sri Lanka</p>
        </div>

        <div className="glass-card auth-glow p-6">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Account Info */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Full Name <span className="text-red-400">*</span></label>
              <input
                id="full_name"
                type="text"
                className="input-base"
                placeholder="e.g. Kavya Perera"
                value={form.full_name}
                onChange={set("full_name")}
                required
                minLength={2}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-medium">Email <span className="text-red-400">*</span></label>
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
                <label className="text-slate-400 text-xs font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  Mobile <span className="text-red-400">*</span>
                </label>
                <input
                  id="mobile_number"
                  type="text"
                  className="input-base font-mono"
                  placeholder="0771234567"
                  value={form.mobile_number}
                  onChange={set("mobile_number")}
                  required
                  maxLength={10}
                  pattern="^\d{10}$"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Password <span className="text-red-400">*</span></label>
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

            {/* Address Details */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                Delivery Address Details
              </p>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-medium">Address Line 1 <span className="text-red-400">*</span></label>
                <input
                  id="address_line_1"
                  type="text"
                  className="input-base"
                  placeholder="e.g. 15 Galle Road"
                  value={form.address_line_1}
                  onChange={set("address_line_1")}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-medium">Address Line 2 <span className="text-slate-600">(Optional)</span></label>
                <input
                  id="address_line_2"
                  type="text"
                  className="input-base"
                  placeholder="e.g. Apt 4B, Floor 3"
                  value={form.address_line_2}
                  onChange={set("address_line_2")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Postal Code <span className="text-red-400">*</span>
                </label>
                <PostalCodeAutocomplete
                  value={form.postal_code}
                  onChange={(result) => {
                    setLocationData(result);
                    setForm((f) => ({ ...f, postal_code: result?.postal_code ?? "" }));
                  }}
                  required
                  placeholder="Type postal code or area (e.g. 100, Colombo…)"
                />
              </div>

              {/* Auto-filled read-only fields */}
              {locationData && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-slate-500 text-[11px] font-medium">Auto-Filled City</label>
                  <input
                    type="text"
                    readOnly
                    className="input-base bg-white/5 text-slate-300 border-white/5 cursor-not-allowed text-xs font-semibold"
                    value={locationData.city}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-[11px] font-medium">Auto-Filled District</label>
                  <input
                    type="text"
                    readOnly
                    className="input-base bg-white/5 text-slate-300 border-white/5 cursor-not-allowed text-xs font-semibold"
                    value={locationData.district}
                  />
                </div>
              </div>
              )}
            </div>

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating Account..." : "Create Account & Sign In"}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
