"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Product } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { Package, Plus, Search, Edit2, ToggleLeft, ToggleRight, X, Save } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", sku: "" });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Product[]>("/products");
      setProducts(data);
    } finally { setLoading(false); }
  };

  const toggleActive = async (product: Product) => {
    await api.put(`/products/${product.id}`, { is_active: !product.is_active });
    fetchProducts();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api.post("/products", {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        category: form.category,
        sku: form.sku || undefined,
      });
      setForm({ name: "", description: "", price: "", category: "", sku: "" });
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create product");
    } finally { setSaving(false); }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute requireAdmin>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Products</h1>
              <p className="text-slate-400 text-sm mt-1">{products.length} products</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancel" : "Add Product"}
            </button>
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="glass-card p-5 mb-6 animate-fade-in">
              <h2 className="text-white font-semibold text-sm mb-4">New Product</h2>
              <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formError && (
                  <div className="sm:col-span-2 text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                    {formError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs">Product Name *</label>
                  <input className="input-base text-sm" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Samsung Galaxy S24" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs">Category *</label>
                  <input className="input-base text-sm" required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Electronics" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs">Price (LKR) *</label>
                  <input type="number" step="0.01" min="0.01" className="input-base text-sm" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="189990.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs">SKU</label>
                  <input className="input-base text-sm" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="ELEC-001" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-slate-400 text-xs">Description</label>
                  <input className="input-base text-sm" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Product description..." />
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              className="input-base pl-9"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Product", "Category", "Price", "SKU", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <span className="text-white text-sm font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{product.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{product.sku || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.is_active ? "text-emerald-400 bg-emerald-400/10" : "text-slate-400 bg-slate-400/10"}`}>
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`flex items-center gap-1 text-xs transition-colors ${product.is_active ? "text-slate-400 hover:text-red-400" : "text-slate-400 hover:text-emerald-400"}`}
                        >
                          {product.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {product.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">No products found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
