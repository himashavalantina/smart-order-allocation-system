"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrderCard from "@/components/OrderCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Order, PaginatedOrders, Branch } from "@/lib/types";
import api from "@/lib/api";
import { Search, Filter } from "lucide-react";

const STATUSES = ["ALL", "PENDING", "ALLOCATED", "UNALLOCATED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Branch[]>("/branches").then(({ data }) => setBranches(data));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const { data } = await api.get<PaginatedOrders>(`/admin/orders?${params}`);
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
    fetchOrders();
  };

  return (
    <ProtectedRoute requireAdmin>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">All Orders</h1>
            <p className="text-slate-400 text-sm mt-1">{total} orders total</p>
          </div>

          {/* Filters */}
          <div className="glass-card p-4 mb-6 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-48 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  className="input-base pl-9 text-sm"
                  placeholder="Search by customer name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (setSearch(searchInput), setPage(1))}
                />
              </div>
              <button
                onClick={() => { setSearch(searchInput); setPage(1); }}
                className="btn-primary px-4 flex items-center gap-2 text-sm"
              >
                <Filter className="w-4 h-4" />
                Apply
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    statusFilter === s
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                      : "bg-white/3 border-white/8 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : orders.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-slate-400">No orders found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="space-y-2">
                  <OrderCard order={order} showCustomer />
                  {/* Quick status update */}
                  <div className="flex gap-2 px-2">
                    <span className="text-slate-500 text-xs self-center">Update status:</span>
                    {["ALLOCATED", "DELIVERED", "CANCELLED"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(order.id, s)}
                        disabled={order.status === s}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-medium border border-white/8 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all">
                Previous
              </button>
              <span className="text-slate-400 text-sm">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
