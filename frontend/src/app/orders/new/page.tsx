"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClassifyNote from "@/components/ClassifyNote";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import { Product, Order, CITIES } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
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
} from "lucide-react";
import Link from "next/link";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function NewOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const router = useRouter();

  useEffect(() => {
    api.get<Product[]>("/products").then(({ data }) => {
      setProducts(data);
    }).finally(() => setLoading(false));
  }, []);

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
    setSubmitting(true);
    setError("");

    const coords = city ? CITIES[city] : null;

    try {
      const { data } = await api.post<Order>("/orders", {
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
        customer_note: note || undefined,
        delivery_city: city || undefined,
        delivery_lat: coords?.lat,
        delivery_lng: coords?.lng,
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
                  <h2 className="text-xl font-bold text-white mb-1">Order Placed!</h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Your order has been successfully allocated.
                  </p>
                  <div className="glass-card p-4 text-left mb-6 space-y-2">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-3">Order Details</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Order ID</span>
                      <span className="text-white font-mono">#{result.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Status</span>
                      <StatusBadge status={result.status} size="sm" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Allocated Branch</span>
                      <span className="text-emerald-400 font-medium">{result.allocated_branch_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total</span>
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
                    No branch currently has sufficient stock for all items in your order. Please try again later or adjust your order.
                  </p>
                </>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <Link href="/orders" className="btn-primary">View Orders</Link>
                <button onClick={() => setResult(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm transition-all">
                  Place Another
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
              <h1 className="text-2xl font-bold text-white">Place Order</h1>
              <p className="text-slate-400 text-sm">Select products and we&apos;ll find the best branch</p>
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
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        selectedCategory === cat
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((product) => {
                    const cartItem = cart.find((c) => c.product.id === product.id);
                    return (
                      <div key={product.id} className="glass-card p-4 hover:border-indigo-500/20 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">{product.category}</span>
                            <h3 className="text-white text-sm font-semibold leading-tight mt-0.5">{product.name}</h3>
                            <p className="text-slate-500 text-xs mt-1 line-clamp-1">{product.description}</p>
                            <p className="text-indigo-300 font-bold text-sm mt-2">{formatCurrency(product.price)}</p>
                          </div>
                          <div className="shrink-0">
                            {cartItem ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQty(product.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-all"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-white font-bold text-sm w-5 text-center">{cartItem.quantity}</span>
                                <button
                                  onClick={() => updateQty(product.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center text-indigo-400 transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-medium transition-all"
                              >
                                <Plus className="w-3 h-3" />
                                Add
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
            <div className="space-y-4">
              {/* Cart */}
              <div className="glass-card p-4">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                  <ShoppingCart className="w-4 h-4 text-indigo-400" />
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
                          <span className="text-indigo-300 text-xs font-bold">
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

              {/* Delivery City */}
              <div className="glass-card p-4 space-y-2">
                <label className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  Delivery City
                </label>
                <select
                  className="input-base text-sm"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">Use my profile city</option>
                  {Object.keys(CITIES).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
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
