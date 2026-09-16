"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Branch, Product } from "@/lib/types";
import api from "@/lib/api";
import {
  MapPin,
  Package,
  Activity,
  Edit2,
  Save,
  X,
  Plus,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInventory, setEditingInventory] = useState<number | null>(null);
  const [inventoryDraft, setInventoryDraft] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Branch[]>("/branches"),
      api.get<Product[]>("/products"),
    ]).then(([bRes, pRes]) => {
      setBranches(bRes.data);
      setProducts(pRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const startEditInventory = (branch: Branch) => {
    const draft: Record<number, number> = {};
    branch.inventory.forEach((inv) => { draft[inv.product_id] = inv.quantity; });
    products.forEach((p) => { if (draft[p.id] === undefined) draft[p.id] = 0; });
    setInventoryDraft(draft);
    setEditingInventory(branch.id);
  };

  const saveInventory = async (branchId: number) => {
    setSaving(true);
    try {
      const inventory = Object.entries(inventoryDraft)
        .filter(([, qty]) => qty >= 0)
        .map(([product_id, quantity]) => ({ product_id: Number(product_id), quantity }));
      await api.put(`/branches/${branchId}/inventory`, { inventory });
      const { data } = await api.get<Branch[]>("/branches");
      setBranches(data);
      setEditingInventory(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Branch Management</h1>
            <p className="text-slate-400 text-sm mt-1">{branches.length} branches — manage inventory and status</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="glass-card overflow-hidden">
                  {/* Branch Header */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          branch.is_active
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "bg-slate-500/10 border border-slate-500/20"
                        )}>
                          <Store className={cn("w-5 h-5", branch.is_active ? "text-emerald-400" : "text-slate-500")} />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-sm">{branch.name}</h3>
                          <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {branch.city || "—"} · {branch.address || "No address"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                              branch.is_active
                                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                                : "text-slate-400 bg-slate-400/10 border-slate-400/30"
                            )}>
                              {branch.is_active ? "Active" : "Inactive"}
                            </span>
                            <span className="text-slate-500 text-[10px] flex items-center gap-1">
                              <Activity className="w-2.5 h-2.5" />
                              {branch.active_orders_count} active orders
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Inventory ({branch.inventory.length} products)
                      </p>
                      {editingInventory === branch.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingInventory(null)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => saveInventory(branch.id)}
                            disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditInventory(branch)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </div>

                    {editingInventory === branch.id ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {products.map((p) => (
                          <div key={p.id} className="flex items-center justify-between gap-3">
                            <span className="text-slate-300 text-xs truncate flex-1">{p.name}</span>
                            <input
                              type="number"
                              min={0}
                              value={inventoryDraft[p.id] ?? 0}
                              onChange={(e) => setInventoryDraft((d) => ({ ...d, [p.id]: Number(e.target.value) }))}
                              className="w-20 input-base py-1 text-xs text-center"
                            />
                          </div>
                        ))}
                      </div>
                    ) : branch.inventory.length === 0 ? (
                      <p className="text-slate-600 text-xs">No inventory set</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {branch.inventory.map((inv) => (
                          <div key={inv.product_id} className="flex items-center justify-between">
                            <span className="text-slate-400 text-xs truncate flex-1">{inv.product_name}</span>
                            <span className={cn(
                              "text-xs font-bold",
                              inv.quantity === 0 ? "text-red-400" : inv.quantity < 10 ? "text-yellow-400" : "text-emerald-400"
                            )}>
                              {inv.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
