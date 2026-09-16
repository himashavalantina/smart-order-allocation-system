"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrderCard from "@/components/OrderCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { Order, PaginatedOrders } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import {
  ShoppingCart,
  Plus,
  Package,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get<PaginatedOrders>("/orders?page=1&page_size=5");
      setOrders(data.orders);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: number) => {
    await api.delete(`/orders/${orderId}`);
    fetchOrders();
  };

  const allocated = orders.filter((o) => o.status === "ALLOCATED").length;
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const totalSpent = orders
    .filter((o) => ["ALLOCATED", "DELIVERED"].includes(o.status))
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          {/* Welcome Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-white">
              Welcome back,{" "}
              <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Here&apos;s a summary of your recent activity</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Spent", value: formatCurrency(totalSpent), icon: ShoppingCart, color: "text-indigo-400" },
              { label: "Allocated", value: allocated, icon: CheckCircle, color: "text-emerald-400" },
              { label: "Pending", value: pending, icon: Clock, color: "text-yellow-400" },
              { label: "Cancelled", value: cancelled, icon: XCircle, color: "text-slate-400" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
                <div>
                  <p className="text-slate-400 text-xs">{s.label}</p>
                  <p className="text-white font-bold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action */}
          <div className="mb-6">
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-2 btn-primary"
            >
              <Plus className="w-4 h-4" />
              Place New Order
            </Link>
          </div>

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Recent Orders
              </h2>
              <Link href="/orders" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No orders yet</p>
                <Link href="/orders/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                  <Plus className="w-4 h-4" />
                  Place your first order
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
