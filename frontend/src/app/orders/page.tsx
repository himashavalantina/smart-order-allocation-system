"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrderCard from "@/components/OrderCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Order, PaginatedOrders } from "@/lib/types";
import api from "@/lib/api";
import { ShoppingCart } from "lucide-react";

const STATUSES = ["ALL", "PENDING", "ALLOCATED", "UNALLOCATED", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "10" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const { data } = await api.get<PaginatedOrders>(`/orders?${params}`);
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: number) => {
    await api.delete(`/orders/${orderId}`);
    fetchOrders();
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">My Orders</h1>
            <p className="text-slate-400 text-sm mt-1">{total} total orders</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  statusFilter === s
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : "bg-white/3 border-white/8 text-slate-400 hover:text-white hover:bg-white/8"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onCancel={handleCancel} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                Previous
              </button>
              <span className="text-slate-400 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
