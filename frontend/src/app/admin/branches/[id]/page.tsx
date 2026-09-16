"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import OrderCard from "@/components/OrderCard";
import { Branch, Order, PaginatedOrders } from "@/lib/types";
import api from "@/lib/api";
import {
  MapPin,
  Store,
  ArrowLeft,
  Package,
  Activity,
  AlertTriangle,
  ShoppingCart,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BranchDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: branchId } = use(params);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Branch>(`/branches/${branchId}`),
      api.get<PaginatedOrders>(`/admin/orders?branch_id=${branchId}&page_size=10`),
    ])
      .then(([bRes, oRes]) => {
        setBranch(bRes.data);
        setRecentOrders(oRes.data.orders);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to load branch data");
      })
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <Navbar />
        <div className="page-wrapper flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !branch) {
    return (
      <ProtectedRoute requireAdmin>
        <Navbar />
        <div className="page-wrapper">
          <div className="container-main text-center py-20">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Branch</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button onClick={() => router.push("/admin/branches")} className="btn-primary px-6">
              Back to Branches
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const lowStockItems = branch.inventory.filter((inv) => inv.quantity < 10);
  const outOfStockItems = branch.inventory.filter((inv) => inv.quantity === 0);

  return (
    <ProtectedRoute requireAdmin>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/admin/branches")}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Branches
            </button>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                    branch.is_active
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-slate-500/10 border border-slate-500/20"
                  )}
                >
                  <Store
                    className={cn("w-7 h-7", branch.is_active ? "text-emerald-400" : "text-slate-500")}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    {branch.name}
                    <span
                      className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full border font-medium",
                        branch.is_active
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                          : "text-slate-400 bg-slate-400/10 border-slate-400/30"
                      )}
                    >
                      {branch.is_active ? "Active" : "Inactive"}
                    </span>
                  </h1>
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {branch.city || "—"} · {branch.address || "No address"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/admin/orders?status=ALL&search=&branch_id=${branch.id}`)}
                className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                View All Orders
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              label="Active Orders"
              value={branch.active_orders_count}
              icon={Activity}
              iconColor="text-emerald-400"
            />
            <StatsCard
              label="Total Products"
              value={branch.inventory.length}
              icon={Package}
              iconColor="text-violet-400"
            />
            <StatsCard
              label="Low Stock Items"
              value={lowStockItems.length}
              icon={AlertTriangle}
              iconColor="text-yellow-400"
              description="< 10 units"
            />
            <StatsCard
              label="Out of Stock"
              value={outOfStockItems.length}
              icon={XCircle}
              iconColor="text-red-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Panel */}
            <div className="lg:col-span-1">
              <div className="glass-card flex flex-col h-[500px]">
                <div className="p-4 border-b border-white/5 shrink-0">
                  <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-violet-400" />
                    Inventory Status
                  </h2>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                  {branch.inventory.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No inventory data available.</p>
                  ) : (
                    branch.inventory.map((inv) => (
                      <div
                        key={inv.product_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <span className="text-slate-300 text-sm truncate pr-2">{inv.product_name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              inv.quantity === 0
                                ? "text-red-400"
                                : inv.quantity < 10
                                ? "text-yellow-400"
                                : "text-emerald-400"
                            )}
                          >
                            {inv.quantity}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Orders Panel */}
            <div className="lg:col-span-2">
              <div className="glass-card flex flex-col h-[500px]">
                <div className="p-4 border-b border-white/5 shrink-0 flex items-center justify-between">
                  <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Recent Allocated Orders
                  </h2>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-16">
                      <CheckCircle className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">No recent orders for this branch.</p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <OrderCard key={order.id} order={order} showCustomer />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


