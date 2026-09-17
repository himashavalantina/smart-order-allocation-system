"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClassifyNote from "@/components/ClassifyNote";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import { Product, Order } from "@/lib/types";
import { getPostalCodeLocation } from "@/lib/locationData";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import PostalCodeAutocomplete, { PostalCodeResult } from "@/components/PostalCodeAutocomplete";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  MessageSquare,
  Package,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Home,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function NewOrderPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [locationMode, setLocationMode] = useState<"profile" | "custom">("profile");

  // Custom address state
  const [mobileNumber, setMobileNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  // Resolved postal code result for custom mode (includes lat/lng)
  const [customLocation, setCustomLocation] = useState<PostalCodeResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Profile location – resolved from the saved postal code
  const profileLocation = getPostalCodeLocation(user?.postal_code || "00300");

  useEffect(() => {
    api.get<Product[]>("/products").then(({ data }) => {
      setProducts(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setMobileNumber(user.mobile_number || "");
      setAddressLine1(user.address_line_1 || "");
      setAddressLine2(user.address_line_2 || "");
    }
  }, [user]);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;

    // Validate custom location is selected when mode is custom
    if (locationMode === "custom" && !customLocation) {
      setError("Please select a valid postal code for your custom delivery address.");
      return;
    }

    setSubmitting(true);
    setError("");

    // Resolve delivery coordinates
    const deliveryLat = locationMode === "profile"
      ? profileLocation.lat
      : customLocation!.lat;
    const deliveryLng = locationMode === "profile"
      ? profileLocation.lng
      : customLocation!.lng;
    const deliveryCity = locationMode === "profile"
      ? profileLocation.city
      : customLocation!.city;
    const deliveryDistrict = locationMode === "profile"
      ? profileLocation.district
      : customLocation!.district;
    const deliveryPostalCode = locationMode === "profile"
      ? user?.postal_code
      : customLocation!.postal_code;

    try {
      const { data } = await api.post<Order>("/orders", {
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
        customer_note: note || undefined,
        delivery_mobile: mobileNumber || undefined,
        delivery_address_line_1: addressLine1 || undefined,
        delivery_address_line_2: addressLine2 || undefined,
        delivery_postal_code: deliveryPostalCode,
        delivery_city: deliveryCity,
        delivery_district: deliveryDistrict,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  // Success/Failure result screen
  if (result) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="page-wrapper flex items-start justify-center pt-16">
          <div className="container-main max-w-lg">
            <div className="glass-card p-8 text-center animate-fade-in">
              {result.status === "ALLOCATED" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">Order Placed & Allocated!</h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Your order was dynamically assigned to the best eligible branch.
                  </p>
                  <div className="glass-card p-4 text-left mb-6 space-y-2.5">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-2">Order Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Order ID</span>
                      <span className="text-white font-mono">#{result.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Status</span>
                      <StatusBadge status={result.status} size="sm" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Allocated Outlet</span>
                      <span className="text-emerald-400 font-medium">{result.allocated_branch_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Delivery City / District</span>
                      <span className="text-emerald-300 font-medium">{result.delivery_city} ({result.delivery_district})</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                      <span className="text-slate-400">Total Amount</span>
                      <span className="text-white font-bold">{formatCurrency(result.total_amount)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">Order Unallocated</h2>
                  <p className="text-slate-400 text-sm">
                    No branch currently has 100% stock availability for all items in your order. Please try again later or adjust your items.
                  </p>
                </>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <Link href="/orders" className="btn-primary">View My Orders</Link>
                <button onClick={() => setResult(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm transition-all">
                  Place Another Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Place New Order</h1>
              <p className="text-slate-400 text-sm">Centroid allocation based on Sri Lankan postal code</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Catalog */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search + Filter */}
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  className="input-base flex-1 min-w-40"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${selectedCategory === cat
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-white/3 border-white/8 text-slate-400 hover:text-white"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((product) => {
                    const cartItem = cart.find((c) => c.product.id === product.id);
                    return (
                      <div key={product.id} className="bg-slate-800 rounded-xl border border-transparent overflow-hidden group hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col">
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-900 border-b border-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-t-xl"
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <span className="inline-block w-max px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2 line-clamp-1">{product.category}</span>
                          <h3 className="text-white text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{product.name}</h3>
                          <p className="text-emerald-400 font-bold text-xl mt-2 mb-4">{formatCurrency(product.price)}</p>

                          <div className="mt-auto">
                            {cartItem ? (
                              <div className="flex items-center justify-between bg-slate-900/50 border border-white/5 rounded-xl p-1 shadow-inner">
                                <button
                                  onClick={() => updateQty(product.id, -1)}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-all active:scale-95"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-white font-bold text-sm text-center px-2">{cartItem.quantity}</span>
                                <button
                                  onClick={() => updateQty(product.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center text-emerald-400 transition-all active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              {/* Cart */}
              <div className="glass-card p-4">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  Cart ({cart.length} items)
                </h2>
                {cart.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">No items added yet</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{item.product.name}</p>
                          <p className="text-slate-400 text-xs">
                            {item.quantity} × {formatCurrency(item.product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-emerald-300 text-xs font-bold">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 flex justify-between">
                      <span className="text-slate-400 text-sm">Total</span>
                      <span className="text-white font-bold text-sm">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address & Postal Centroid Selector */}
              <div className="glass-card p-4 space-y-3 relative z-10">
                <label className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Delivery Location
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLocationMode("profile")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${locationMode === "profile"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-white font-medium"
                      : "bg-white/3 border-white/8 text-slate-400 hover:text-white"
                      }`}
                  >
                    <p className="font-semibold text-white">Profile Address</p>
                    <p className="text-[11px] text-emerald-300 mt-0.5 font-medium truncate">
                      📍 {user?.location_city || "Saved Profile"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationMode("custom")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${locationMode === "custom"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-white font-medium"
                      : "bg-white/3 border-white/8 text-slate-400 hover:text-white"
                      }`}
                  >
                    <p className="font-semibold text-white">Custom Location</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Different address</p>
                  </button>
                </div>

                {locationMode === "custom" && (
                  <div className="pt-2 space-y-3 animate-fade-in border-t border-white/5">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Mobile Number</label>
                      <input
                        type="text"
                        className="input-base text-xs font-mono"
                        placeholder="0771234567"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Address Line 1</label>
                      <input
                        type="text"
                        className="input-base text-xs"
                        placeholder="Street address"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Postal Code</label>
                      <PostalCodeAutocomplete
                        value={customLocation?.postal_code || ""}
                        onChange={(result) => setCustomLocation(result)}
                        placeholder="  Type postal code or area…"
                      />
                    </div>

                    {/* Auto-filled read-only fields */}
                    {customLocation && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[10px]">Auto-Filled City</label>
                          <input
                            type="text"
                            readOnly
                            className="input-base bg-white/5 text-slate-300 border-white/5 cursor-not-allowed text-xs font-semibold"
                            value={customLocation.city}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 text-[10px]">Auto-Filled District</label>
                          <input
                            type="text"
                            readOnly
                            className="input-base bg-white/5 text-slate-300 border-white/5 cursor-not-allowed text-xs font-semibold"
                            value={customLocation.district}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Note + AI */}
              <div className="glass-card p-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    Order Note (optional)
                  </label>
                  <textarea
                    className="input-base resize-none"
                    rows={3}
                    placeholder="Any special instructions or questions..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={2000}
                  />
                </div>
                {note.trim().length >= 5 && <ClassifyNote message={note} />}
              </div>

              {/* Error */}
              {error && (
                <div className="glass-card p-3 border-red-500/20 bg-red-500/5 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || submitting}
                className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                {submitting ? "Placing Order..." : `Place Order · ${formatCurrency(cartTotal)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
